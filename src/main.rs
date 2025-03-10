use actix_web::{web, App, HttpServer};
use crate::handlers::ping::ping;

mod config;
mod handlers;

#[actix_web::main]
async fn main() {
    println!("SERVER COMMANDER");

    println!("Getting config...");
    let config = config::Config::new("test.conf").await;

    HttpServer::new(|| {
        App::new()
            .service(ping)
    }).bind("127.0.0.1:8080").unwrap()
        .run().await.unwrap();

}
