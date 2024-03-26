// Import module containing request handlers
mod handlers;

// Import necessary crates and modules
use actix_cors::Cors; // Import Cors middleware for handling CORS
use std::{ env, panic }; // Import standard library modules
use tauri::AppHandle; // Import AppHandle from Tauri
use actix_web::{ http::header, web, App, HttpServer }; // Import actix-web modules for creating web server
use sqlx::postgres::PgPoolOptions; // Import PgPoolOptions for PostgreSQL connection pooling
use sqlx::{ Pool, Postgres }; // Import Pool and Postgres types from sqlx

// Define a struct to hold Tauri app state and database pool
struct TauriAppState {
    app: AppHandle, // Tauri app handle
    pool: Pool<Postgres>, // PostgreSQL connection pool
}

// Main function to initialize the server
#[actix_web::main]
pub async fn init(app: AppHandle) -> Result<(), std::io::Error> {
    // Attempt to connect to the database
    let result = connect_db().await;

    // Handle database connection errors
    if let Err(err) = result {
        println!("db connection error: {err}");
        panic!(); // Panic if unable to connect to the database
    }

    let pool = result.unwrap(); // Get the database connection pool

    // Initialize the app state with Tauri app handle and database pool
    let tauri_app = web::Data::new(TauriAppState {
        app,
        pool,
    });

    // Configure the HTTP server
    HttpServer::new(move || {
        // Configure CORS middleware
        let cors = Cors::default()
            .allowed_origin("http://localhost:3000") // Allow requests from localhost:3000
            .allowed_methods(vec!["GET", "POST"]) // Allow GET and POST methods
            .allowed_headers(vec![header::AUTHORIZATION, header::ACCEPT, header::CONTENT_TYPE]) // Allow specified headers
            .supports_credentials() // Support credentials (cookies, authorization headers)
            .max_age(3600); // Set maximum age for preflight response

        // Create the Actix web application
        App::new()
            .wrap(cors) // Wrap the application with CORS middleware
            .app_data(tauri_app.clone()) // Pass Tauri app state to handler routes
            .service(handlers::users::register) // Register user registration handler
            .service(handlers::users::login) // Register user login handler
    })
        .bind(("127.0.0.1", 4875))
        ? // Bind server to specified IP address and port
        .run().await // Run the server
}

// Function to connect to the database
async fn connect_db() -> Result<sqlx::Pool<Postgres>, sqlx::Error> {
    let postgres_password = env::var("PGPASSWORD").unwrap(); // Get PostgreSQL password from environment variable
    let connection_string = format!(
        "postgresql://KaizenTaskNeonDB_owner:{postgres_password}@ep-flat-sun-a500plqm-pooler.us-east-2.aws.neon.tech/KaizenTaskNeonDB?sslmode=require"
    ); // Construct connection string

    // Create a connection pool with specified options
    let pool = PgPoolOptions::new().max_connections(5).connect(&connection_string).await?;

    println!("Connected to NeonDB"); // Print message indicating successful database connection
    Ok(pool) // Return the database connection pool
}
