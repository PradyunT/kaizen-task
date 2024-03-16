use crate::server;
use anyhow;

use actix_web::{ post, web, HttpResponse };
use serde::Deserialize;
use argon2::{
    password_hash::{ rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString },
    Argon2,
};
use sqlx::{ Pool, Postgres };

#[derive(Deserialize, Debug)]
struct User {
    username: String,
    email: String,
    password: String,
}

#[post("/auth/register_user")]
pub async fn register_user(
    data: web::Data<server::TauriAppState>,
    user: web::Json<User>
) -> HttpResponse {
    // Get pool from appstate
    let pool = &data.pool;

    // Get user's values from deserialized JSON
    let username = &user.username;
    let email = &user.email;
    let password = user.password.clone();

    // Hash the user's password
    let hashed_password = hash_user_password(password);

    // Write sql query to store the registering user in the db
    if let Err(_) = store_user(username, email, &hashed_password, pool).await {
        HttpResponse::InternalServerError().body("Failed to store user into database");
    }

    // Update the Authstate
    // data.logged_in = true;
    println!("User registered successfully");
    HttpResponse::Ok().body("User registered successfully")
}

async fn store_user(
    username: &str,
    email: &str,
    hashed_password: &str,
    pool: &Pool<Postgres>
) -> anyhow::Result<()> {
    sqlx
        ::query("INSERT INTO users(username, email, password)
            VALUES($1, $2, $3)")
        .bind(username)
        .bind(email)
        .bind(hashed_password)
        .execute(pool).await?;
    Ok(())
}

fn hash_user_password(password: String) -> String {
    // Hash the user's password
    let password = password.as_bytes();
    let salt = SaltString::generate(&mut OsRng);

    // Argon2 with default params (Argon2id v19)
    let argon2 = Argon2::default();

    // Hash password to PHC string ($argon2id$v=19$...)
    let password_hash = argon2.hash_password(password, &salt).unwrap().to_string();

    password_hash
}

fn verify_password(password: String, hashed_password: String) -> bool {
    // Verify password against PHC string.
    let password = password.as_bytes();
    let parsed_hash = PasswordHash::new(&hashed_password).unwrap();
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

    // #[test]
    // fn hash_one_password() {
    //     let password = "password".to_string();
    //     let salt = &SaltString::from_b64("iTta0GSrGaNDFUAvcUjzHg").unwrap();
    //     let hashed_password = hash_user_password(password, salt);
    //     assert_eq!(
    //         hashed_password,
    //         "$argon2id$v=19$m=19456,t=2,p=1$iTta0GSrGaNDFUAvcUjzHg$LrOIIudAGCX0dqmt3bOtheaVMI1+jnXNT5gGsjLFwpg".to_string()
    //     );
    // }
}
