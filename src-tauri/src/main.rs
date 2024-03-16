// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
pub mod server;
pub mod commands;

use commands::*;
use std::thread;
use dotenv::dotenv;
#[tokio::main]
async fn main() {
    // Load environment variables from .env file
    dotenv().ok();

    tauri::Builder
        ::default()
        .setup(|app| {
            // The app closure is executed before initializing the tauri app and then passed into handle
            let handle = app.handle();
            let boxed_handle = Box::new(handle);

            // Create a new thread and start the server
            thread::spawn(move || {
                server::init(*boxed_handle).unwrap();
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet, handle_register_user])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
