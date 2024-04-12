use sqlx::{ PgPool, Error as SqlxError };
use async_trait::async_trait;

#[async_trait]
pub trait TaskRepository {
    async fn add_task(&self, task: &Task) -> Result<(), SqlxError>;
    async fn delete_task(&self, task_id: u32) -> Result<(), SqlxError>;
    async fn get_tasks(&self, user_email: &str) -> Result<Vec<Task>, SqlxError>;
}

pub struct PostgresTaskRepository {
    pool: PgPool,
}

#[async_trait]
impl TaskRepository for PostgresTaskRepository {
    async fn add_task(&self, task: &Task) -> Result<(), SqlxError> {
        sqlx
            ::query(
                "INSERT INTO tasks (user_email, title, description, date, duration, priority) VALUES ($1, $2, $3, $4, $5, $6)",
                task.user_email,
                task.title,
                task.description,
                task.date,
                task.duration,
                task.priority
            )
            .execute(&self.pool).await?;
        Ok(())
    }

    async fn delete_task(&self, task_id: u32) -> Result<(), SqlxError> {
        sqlx
            ::query("DELETE FROM tasks WHERE task_id = $1", task_id as i32)
            .execute(&self.pool).await?;
        Ok(())
    }

    async fn get_tasks(&self, user_email: &str) -> Result<Vec<Task>, SqlxError> {
        let tasks = sqlx
            ::query_as(Task, "SELECT * FROM tasks WHERE user_email = $1", user_email)
            .fetch_all(&self.pool).await?;
        Ok(tasks)
    }
}

#[derive(sqlx::FromRow)]
pub struct Task {
    pub task_id: i32,
    pub user_email: String,
    pub title: String,
    pub description: String,
    pub date: Option<chrono::NaiveDate>,
    pub duration: Option<i32>,
    pub priority: Option<i32>,
}
