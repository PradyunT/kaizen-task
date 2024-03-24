mod handlers;

use actix_cors::Cors;

use std::{ env, panic };
use tauri::AppHandle;
use actix_web::{ http::header, web, App, HttpServer };
use sqlx::postgres::PgPoolOptions;
use sqlx::{ Pool, Postgres };

struct TauriAppState {
    app: AppHandle,
    pool: Pool<Postgres>,
}

#[actix_web::main]
pub async fn init(app: AppHandle) -> Result<(), std::io::Error> {
    let result = connect_db().await;
    if let Err(err) = result {
        println!("db connection error: {err}");
        panic!();
    }

    let pool = result.unwrap();

    // Initialize the app state
    let tauri_app = web::Data::new(TauriAppState {
        app,
        pool,
    });

    HttpServer::new(move || {
        let cors = Cors::default()
            .allowed_origin("http://localhost:3000")
            .allowed_methods(vec!["GET", "POST"])
            .allowed_headers(vec![header::AUTHORIZATION, header::ACCEPT, header::CONTENT_TYPE])
            .supports_credentials()
            .max_age(3600);

        App::new()
            .wrap(cors)
            .app_data(tauri_app.clone()) // pass appstate to handler routes
            .service(handlers::users::register)
            .service(handlers::users::login)
    })
        .bind(("127.0.0.1", 4875))?
        .run().await
}

async fn connect_db() -> Result<sqlx::Pool<Postgres>, sqlx::Error> {
    let postgres_password = env::var("PGPASSWORD").unwrap();
    let connection_string = format!(
        "postgresql://KaizenTaskNeonDB_owner:{postgres_password}@ep-flat-sun-a500plqm-pooler.us-east-2.aws.neon.tech/KaizenTaskNeonDB?sslmode=require"
    );

    // Create a connection pool
    let pool = PgPoolOptions::new().max_connections(5).connect(&connection_string).await?;

    println!("Connected to NeonDB");
    Ok(pool)
}
