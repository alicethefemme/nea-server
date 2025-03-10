use crate::routes::get_routes;

mod config;
mod routes;
mod handlers;

#[tokio::main]
async fn main() {
    println!("SERVER COMMANDER");

    println!("Getting config...");
    let config = config::Config::new("target/test.conf");

    warp::serve(get_routes()).run(([0, 0, 0, 0], 8080)).await;
}
