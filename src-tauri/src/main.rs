// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Importing modules from other files
pub mod server;
pub mod commands;

// Importing necessary crates
use commands::*;
use serde::Serialize;
use tauri::Manager;
use std::{ sync::Mutex, thread };
use dotenv::dotenv;

// Define a struct to hold authentication state
#[derive(Serialize)]
pub struct AuthState {
    token: Option<String>, // Optional token string
    logged_in: bool, // Boolean indicating whether user is logged in
}

// Implementing default values for AuthState
impl Default for AuthState {
    fn default() -> Self {
        Self {
            token: None, // Token is initially None
            logged_in: false, // User is initially not logged in
        }
    }
}

// The main function of the program
#[tokio::main]
async fn main() {
    // Load environment variables from .env file
    dotenv().ok();

    // Building the Tauri application
    tauri::Builder
        ::default() // Use default Tauri settings
        .setup(|app| {
            // The app closure is executed before initializing the Tauri app and then passed into handle

            // Access the Tauri manager handle
            let handle = app.handle();

            // Create a mutex to manage shared access to AuthState
            handle.manage(Mutex::new(AuthState::default()));

            // Clone the handle to pass into the new thread
            let boxed_handle = Box::new(handle);

            // Create a new thread and start the server
            thread::spawn(move || {
                server::init(*boxed_handle).unwrap(); // Initialize the server with the handle
            });

            Ok(()) // Return Ok to indicate setup was successful
        })
        .invoke_handler(tauri::generate_handler![is_authorized]) // Set up the handler for authorization check
        .run(tauri::generate_context!()) // Run the Tauri application
        .expect("error while running tauri application"); // Handle any errors
}
