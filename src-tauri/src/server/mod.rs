mod handlers;

use std::{ env, panic, sync::Mutex };
use tauri::AppHandle;
use actix_web::{ middleware, web, App, HttpServer };
use sqlx::postgres::PgPoolOptions;
use sqlx::{ Pool, Postgres };
struct TauriAppState {
    app: AppHandle,
    pool: Pool<Postgres>,
    token: Option<String>,
    logged_in: bool,
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
    let tauri_app_state = web::Data::new(TauriAppState {
        app,
        pool,
        token: None,
        logged_in: false,
    });

    HttpServer::new(move || {
        App::new()
            .app_data(tauri_app_state.clone()) // pass appstate to handler routes
            .wrap(middleware::Logger::default())
            .service(handlers::users::register_user)
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
