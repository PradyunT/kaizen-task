use std::env;

use jwt_compact::{ alg::{ Hs256, Hs256Key }, AlgorithmExt, Token, UntrustedToken };
use serde::{ Deserialize, Serialize };

/// Function to verify a JWT token.
pub fn verify_token(token_string: &str) -> Result<Token<CustomClaims>, anyhow::Error> {
    // Load secret key from environment variable
    let secret = env::var("TOKENSECRET").expect("TOKENSECRET not set");
    let key = Hs256Key::new(secret.as_bytes());
    // Parse the token.
    let token = UntrustedToken::new(token_string)?;
    // Before verifying the token, we might find the key which has signed the token
    // using the `Header.key_id` field.
    assert_eq!(token.header().key_id.as_deref(), Some("my-key"));
    // Validate the token integrity.
    let token: Token<CustomClaims> = Hs256.validator(&key).validate(&token)?;
    // Validate additional conditions.
    Ok(token)
}

/// Custom claims encoded in the token.
#[derive(Debug, PartialEq, Serialize, Deserialize)]
pub struct CustomClaims {
    #[serde(rename = "email")]
    pub email: String, // User's email
}
