use std::sync::Mutex;

use crate::{ server, AuthState };
use anyhow;

use tauri::Manager;

use actix_web::{ post, web, HttpResponse };
use serde::{ Serialize, Deserialize };
use argon2::{
    password_hash::{ rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString },
    Argon2,
};
use sqlx::{ Pool, Postgres };
/// Represents the user data received from the client during registration.
#[derive(Deserialize, Debug)]
struct RegisterUser {
    username: String,
    email: String,
    password: String,
}

#[derive(Deserialize, Debug)]
struct LoginUser {
    username: String,
    password: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct UserClaims {
    email: String,
}

/// Endpoint for registering a new user.
#[post("/auth/register")]
pub async fn register(
    data: web::Data<server::TauriAppState>,
    user: web::Json<RegisterUser>
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
        let e = format!("{}", { err });
        if e.contains("duplicate key value") {
            error_message = "User with email already exists".to_string();
        } else {
            error_message = format!("Failed to store user into database: {}", e);
        }

        // Return an error response
        return HttpResponse::InternalServerError().json(error_message);
    }

    // Update the authentication state
    let authstate_mutex = data.app.state::<Mutex<AuthState>>();
    let mut state = authstate_mutex.lock().unwrap();
    state.logged_in = true;

    HttpResponse::Ok().json("User registered successfully")
}

#[post("/auth/login")]
async fn login(user: web::Json<LoginUser>) -> HttpResponse {
    // TODO Finish login logic
    println!("Login was called! {:?}", user);
    // Verify user's password
    // Send OK response with token
    let user = UserClaims { email: "example@gmail.com".to_string() };

    HttpResponse::Ok().body("You are now logged in")
}

/// Asynchronously stores a new user in the database.
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
