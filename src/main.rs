use actix_web::{web, App, HttpServer};
use crate::handlers::ping::ping;

mod config;
mod handlers;

#[actix_web::main]
async fn main() {
    println!("SERVER COMMANDER");

    println!("Getting config...");
    let config = config::Config::new("test.conf").await;

    println!("Server is running on {:?}:{:?}", config.ip_addr, config.port);
    HttpServer::new(|| {
        App::new()
            .service(ping)
    }).bind(format!("{:?}:{:?}", config.ip_addr, config.port)).unwrap()
        .run().await.unwrap();


}
