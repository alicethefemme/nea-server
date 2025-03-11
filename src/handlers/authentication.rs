use actix_web::{get, web, HttpResponse, Responder};
use serde::Deserialize;
use crate::tools::state::AppState;


#[derive(Deserialize)]
struct UserTfa {
    username: String
}

#[get("/api/authentication/get_tfa")]
pub async fn get_tfa_for_user(data: web::Data<AppState>, user_tfa: web::Json<UserTfa>) -> impl Responder {
    let username = &user_tfa.username;

    //TODO: Connect to database and check for user. If user exists, check if 2fa is enabled on their account.
    let db = &data.db;
    db.get_tfa_status("alice".parse().unwrap()).await.unwrap();

    HttpResponse::Ok()
}