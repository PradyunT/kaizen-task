use std::collections::HashMap;

// create the error type that represents all errors possible in our program
#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("Failed to make server request: {0}")] Request(#[from] reqwest::Error),
}

// we must manually implement serde::Serialize
impl serde::Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error> where S: serde::ser::Serializer {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

#[tauri::command]
pub async fn handle_register_user(
    username: String,
    email: String,
    password: String
) -> Result<String, Error> {
    println!("Got values: {username}, {email}, {password}");

    // Send POST request to server
    let mut map = HashMap::new();
    map.insert("username", username);
    map.insert("email", email);
    map.insert("password", password);

    let client = reqwest::Client::new();
    let res = client.post("http://localhost:4875/auth/register_user").json(&map).send().await;

    match res {
        Ok(_) => {
            return Ok("Added user".to_string());
        }
        Err(e) => {
            return Err(Error::Request(e));
        }
    }

    // Ok("User registered");
}

#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}
