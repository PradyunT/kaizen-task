// Import necessary modules and crates
use std::env; // Import environment module
use crate::server; // Import server module
use anyhow; // Import anyhow crate for error handling
use serde_json::json; // Import serde_json crate for JSON serialization
use actix_web::{ post, web, HttpResponse }; // Import actix_web modules for handling HTTP requests
use serde::{ Serialize, Deserialize }; // Import serde modules for serialization and deserialization
use argon2::{ // Import argon2 crate for password hashing
    password_hash::{ rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString }, // Import password hashing related structs and traits
    Argon2, // Import Argon2 struct for password hashing
};
use sqlx::{ Pool, Postgres }; // Import sqlx modules for PostgreSQL interaction
use chrono::{ Duration, Utc }; // Import chrono modules for date and time operations
use jwt_compact::{ prelude::*, alg::{ Hs256, Hs256Key } }; // Import jwt_compact modules for JWT token handling

/// Represents the user data received from the client during registration.
#[derive(Deserialize, Debug, sqlx::FromRow)]
struct RegisterUser {
    username: String, // User's username
    email: String, // User's email
    password: String, // User's password
}

/// Represents the user data received from the client during login.
#[derive(Deserialize, Debug, sqlx::FromRow)]
struct LoginUser {
    email: String, // User's email
    password: String, // User's password
}

/// Custom claims encoded in the token.
#[derive(Debug, PartialEq, Serialize, Deserialize)]
struct CustomClaims {
    #[serde(rename = "email")]
    email: String, // User's email
}

/// Endpoint for registering a new user.
#[post("/auth/register")]
pub async fn register(
    data: web::Data<server::TauriAppState>, // Tauri application state
    user: web::Json<RegisterUser> // JSON payload containing user registration data
) -> HttpResponse {
    // Get the database connection pool from the application state
    let pool = &data.pool;

    // Extract user data from the JSON payload
    let username = &user.username;
    let email = &user.email;
    let password = user.password.clone();

    // Hash the user's password
    let hashed_password = hash_user_password(password);

    // Attempt to store the user in the database
    if let Err(err) = store_user(username, email, &hashed_password, pool).await {
        let error_message: String;
        let err_string = format!("{}", { err });
        if err_string.contains("duplicate key value") {
            error_message = "User with email already exists".to_string();
        } else {
            error_message = format!("Failed to store user into database: {}", err_string);
        }
        // Return an error response
        return HttpResponse::InternalServerError().json(error_message);
    }

    // Send OK response with token
    let result = generate_token();
    if let Ok(token) = result {
        HttpResponse::Ok().json(
            json!({"message": "User registered successfully", "token": token, "user_email": user.email, "user_username": user.username})
        )
    } else {
        HttpResponse::InternalServerError().json("Failed to generate token")
    }
}

/// Endpoint for user login.
#[post("/auth/login")]
async fn login(data: web::Data<server::TauriAppState>, user: web::Json<LoginUser>) -> HttpResponse {
    // Get the database connection pool from the application state
    let pool = &data.pool;

    // Extract user data from the JSON payload
    let email = &user.email.to_lowercase(); // Convert email to lowercase for case-insensitive comparison
    let password = user.password.clone(); // Clone password

    // Get user's hashed password from the database
    let result = sqlx
        ::query_as::<_, RegisterUser>("SELECT * FROM users WHERE email = $1")
        .bind(email)
        .fetch_optional(pool).await;

    match result {
        // If user is found in the database
        Ok(found_user) => {
            // Destructure user from database query Option
            if let Some(login_user) = found_user {
                // Verify user-entered password against user's password
                if verify_password(password, login_user.password) {
                    // Password is correct
                    // Send OK response with token
                    let result = generate_token();
                    if let Ok(token) = result {
                        HttpResponse::Ok().json(
                            json!({"message": "You are now logged in", "token": token, "user_email": login_user.email, "user_username": login_user.username})
                        )
                    } else {
                        HttpResponse::InternalServerError().json("Failed to generate token")
                    }
                } else {
                    // Password is incorrect
                    HttpResponse::Forbidden().json("Incorrect email or password")
                }
            } else {
                // User not found
                return HttpResponse::InternalServerError().json(
                    "User with specified email not found"
                );
            }
        }
        // If query returns an error
        Err(err) => {
            let err_string = format!("{}", { err });

            // Return an error response
            return HttpResponse::InternalServerError().json(err_string);
        }
    }
}

/// Function to generate a JWT token.
fn generate_token() -> Result<String, anyhow::Error> {
    // Choose time-related options for token creation / validation.
    let time_options = TimeOptions::default();
    // Create a symmetric HMAC key, which will be used both to create and verify tokens.
    let secret = env::var("TOKENSECRET").expect("TOKENSECRET not set"); // Get token secret from environment variable
    let key = Hs256Key::new(secret.as_bytes());
    // Create a token.
    let header = Header::empty().with_key_id("my-key"); // Create header with key ID
    let claims = Claims::new(CustomClaims { email: "example.email@email.com".to_owned() }) // Create claims with email
        .set_duration_and_issuance(&time_options, Duration::hours(1)) // Set token expiration time
        .set_not_before(Utc::now()); // Set token not before time
    let token = Hs256.token(&header, &claims, &key)?; // Generate token
    Ok(token) // Return generated token
}

/// Function to verify a JWT token.
fn verify_token(token_string: String) -> Result<Token<CustomClaims>, anyhow::Error> {
    // Load secret key from environment variable
    let secret = env::var("TOKENSECRET").expect("TOKENSECRET not set");
    let key = Hs256Key::new(secret.as_bytes());
    // Choose time-related options for token creation / validation.
    let time_options = TimeOptions::default();
    // Parse the token.
    let token = UntrustedToken::new(&token_string)?;
    // Before verifying the token, we might find the key which has signed the token
    // using the `Header.key_id` field.
    assert_eq!(token.header().key_id.as_deref(), Some("my-key"));
    // Validate the token integrity.
    let token: Token<CustomClaims> = Hs256.validator(&key).validate(&token)?;
    // Validate additional conditions.
    Ok(token)
}
/// Asynchronously stores a new user in the database.
// TODO move the function's logic back into register user
async fn store_user(
    username: &str,
    email: &str,
    hashed_password: &str,
    pool: &Pool<Postgres>
) -> anyhow::Result<()> {
    // Execute SQL query to insert user into the database
    sqlx
        ::query("INSERT INTO users(username, email, password)
            VALUES($1, $2, $3)")
        .bind(username)
        .bind(email)
        .bind(hashed_password)
        .execute(pool).await?;
    Ok(())
}

/// Hashes the user's password using Argon2 algorithm.
fn hash_user_password(password: String) -> String {
    // Convert password to bytes
    let password = password.as_bytes();
    // Generate a random salt
    let salt = SaltString::generate(&mut OsRng);

    // Create an Argon2 password hasher
    let argon2 = Argon2::default();

    // Hash the password
    let password_hash = argon2.hash_password(password, &salt).unwrap().to_string();

    password_hash
}

/// Verifies whether the provided password matches the hashed password.
fn verify_password(password: String, hashed_password: String) -> bool {
    // Convert password to bytes
    let password = password.as_bytes();
    // Parse the hashed password
    let parsed_hash = PasswordHash::new(&hashed_password).unwrap();
    // Verify the password
    Argon2::default().verify_password(password, &parsed_hash).is_ok()
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn verify_one_password() {
        let password = "password".to_string();
        let hashed_password =
            "$argon2id$v=19$m=19456,t=2,p=1$mK1zp767ZDsSClJ8HP+qtw$uJdh3qZK9UKyNzL4kO1JSEA8mw0KoQ6YZ+oAId7PmY4".to_string();
        assert!(verify_password(password, hashed_password));
    }
}
