use crate::server;
use actix_web::{ get, post, web, HttpResponse, HttpRequest };
use serde::Deserialize;
use crate::server::handlers::auth;

#[derive(Deserialize, Debug)]
struct AddTask {
    user_email: String,
    title: String,
    description: String,
    date: String,
    duration: i32,
    priority: i32,
}

#[get("/tasks")]
pub async fn get_tasks(data: web::Data<server::TauriAppState>) -> HttpResponse {
    let pool = &data.pool;
    let response = sqlx::query("SELECT * FROM tasks").execute(pool).await;
    match response {
        Ok(_tasks) => HttpResponse::Ok().finish(),
        Err(e) => HttpResponse::InternalServerError().json(e.to_string()),
    }
}

#[post("/tasks/create")]
pub async fn create_task(
    data: web::Data<server::TauriAppState>,
    req: HttpRequest,
    task: web::Json<AddTask>
) -> HttpResponse {
    // Extract token from request headers
    let token = req
        .headers()
        .get("Authorization")
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.split(" ").last());

    // Verify token validity (implement your token verification logic here)
    if let Some(token) = token {
        // Verify token
        let verified_token = auth::verify_token(token);
        if let Err(e) = verified_token {
            // Return unauthorized if token verification fails
            println!("Token verification failed: {:?}", e);
            return HttpResponse::Unauthorized().finish();
        }
    } else {
        // Return unauthorized if token is missing or invalid
        return HttpResponse::Unauthorized().finish();
    }

    // If token has been verified, proceed with task creation logic
    let pool = &data.pool;
    println!("{:?}", task);

    // Extract data from payload
    let (user_email, title, description, date, duration, priority) = (
        task.user_email.clone(),
        task.title.clone(),
        task.description.clone(),
        task.date.clone(),
        task.duration,
        task.priority,
    );

    // Store task in database
    let result = sqlx
        ::query(
            "INSERT INTO tasks(user_email, title, description, checked, date, duration, priority)
        VALUES($1, $2, $3, $4, $5, $6, $7)"
        )
        .bind(user_email)
        .bind(title)
        .bind(description)
        .bind(false) // Assuming checked is always false initially
        .bind(date)
        .bind(duration)
        .bind(priority)
        .execute(pool).await;

    // Handle error case
    if let Err(err) = result {
        let error_message: String;
        let err_string = format!("{}", { err });
        error_message = format!("Failed to store task into database: {}", err_string);

        // Return an error response
        return HttpResponse::InternalServerError().json(error_message);
    }
    // Implement task creation logic here
    HttpResponse::Ok().json("Task created successfully")
}
