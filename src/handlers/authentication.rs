use actix_web::{get, web, HttpResponse, Responder};
use serde::Deserialize;
use sqlx::Error;
use crate::tools::state::AppState;


#[derive(Deserialize)]
struct UserTfa {
    username: String
}

#[get("/api/authentication/get_tfa")]
pub async fn get_tfa_for_user(data: web::Data<AppState>, user_tfa: web::Json<UserTfa>) -> impl Responder {
    let username = &user_tfa.username;
    let db = &data.db;

    match db.get_tfa_status(username.clone()).await {
        Ok(r) => {
            HttpResponse::Ok().body(r.to_string())
        }
        Err(e) => {
            println!("[WARNING] Unable to extract column. Error: {}", e.to_string());
            HttpResponse::Ok().body(false.to_string())
        }
    }
}