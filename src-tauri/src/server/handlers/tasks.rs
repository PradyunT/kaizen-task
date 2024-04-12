use crate::server;
use actix_web::{ delete, get, post, web, HttpRequest, HttpResponse };
use serde::{ Deserialize, Serialize };
use sqlx::{ prelude::FromRow, Executor };
use crate::server::handlers::auth;

#[derive(Deserialize, Debug)]
struct AddTask {
    user_email: String,
    title: String,
    description: String,
    date: Option<String>,
    duration: Option<i32>,
    priority: Option<i32>,
}

#[derive(FromRow, Debug, Serialize)]
struct Task {
    task_id: i32,
    user_email: String,
    title: String,
    description: String,
    checked: bool,
    date: Option<String>,
    duration: Option<i32>,
    priority: Option<i32>,
}

// Function to verify token from request header
async fn verify_request_token(req: &HttpRequest) -> Result<(), HttpResponse> {
    let token = req
        .headers()
        .get("Authorization")
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.split(" ").last());

    match token {
        Some(token) => {
            match auth::verify_token(token) {
                Ok(_) => Ok(()),
                Err(e) => Err(HttpResponse::Unauthorized().json(e.to_string())),
            }
        }
        None => Err(HttpResponse::Unauthorized().finish()),
    }
}

#[get("/tasks/{user_email}")]
pub async fn get_tasks(
    data: web::Data<server::TauriAppState>,
    req: HttpRequest, // Add HttpRequest to parameters
    path: web::Path<String>
) -> HttpResponse {
    // Use the new function for token verification
    if let Err(response) = verify_request_token(&req).await {
        return response;
    }

    let user_email = path.into_inner().to_lowercase();
    let pool = &data.pool;
    let response = sqlx
        ::query_as::<_, Task>("SELECT * FROM tasks WHERE user_email = $1")
        .bind(user_email)
        .fetch_all(pool).await;
    match response {
        Ok(tasks) => {
            return HttpResponse::Ok().json(tasks);
        }
        Err(e) => HttpResponse::InternalServerError().json(e.to_string()),
    }
}

#[post("/tasks/create")]
pub async fn create_task(
    data: web::Data<server::TauriAppState>,
    req: HttpRequest,
    task: web::Json<AddTask>
) -> HttpResponse {
    // Use the new function for token verification
    if let Err(response) = verify_request_token(&req).await {
        return response;
    }

    let pool = &data.pool;

    // Extract data from payload
    let (user_email, title, description, date, duration, priority) = (
        task.user_email.clone().to_lowercase(),
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

#[delete("/tasks/delete/{task_id}")]
pub async fn delete_task(
    data: web::Data<server::TauriAppState>,
    req: HttpRequest, // Add HttpRequest to parameters
    path: web::Path<String>
) -> HttpResponse {
    // Use the new function for token verification
    if let Err(response) = verify_request_token(&req).await {
        return response;
    }

    let task_id: u32 = path.into_inner().parse().expect("task_id should be a number");
    let pool = &data.pool;

    let result = pool.execute(
        sqlx::query("DELETE * FROM tasks WHERE task_id = $1").bind(task_id as i32)
    ).await;

    match result {
        Ok(_) => {
            return HttpResponse::Ok().finish();
        }
        Err(e) => HttpResponse::InternalServerError().json(e.to_string()),
    }
}
