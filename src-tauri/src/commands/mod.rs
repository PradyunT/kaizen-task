use std::sync::Mutex;

use tauri::State;

use crate::AuthState;

// create the error type that represents all errors possible in our program
#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("Failed to make server request: {0}")] Request(#[from] reqwest::Error),
    #[error("Server failed with non 200 status code")] Server(),
}

// we must manually implement serde::Serialize
impl serde::Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error> where S: serde::ser::Serializer {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

#[tauri::command]
pub fn is_authorized(state_mutex: State<'_, Mutex<AuthState>>) -> bool {
    let state = state_mutex.lock().unwrap();
    state.logged_in == true
}
