use crate::handlers::authentication::get_tfa_for_user;
use crate::handlers::ping::ping;
use crate::tools::db::DB;
use crate::tools::state::AppState;
use actix_web::{App, HttpServer, web};

mod config;
mod handlers;
mod tools;

#[actix_web::main]
async fn main() {
    println!("SERVER COMMANDER");

    println!("Getting config...");
    let config = config::Config::new("test.conf").await;

    // Create the database, and initialise the default tables.
    let db_pool: DB = DB::create_pool(&*config.database_path).await.unwrap();
    db_pool.create_default_tables().await.unwrap();

    println!(
        "Server is running on {:?}:{:?}",
        config.ip_addr, config.port
    );
    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(AppState {
                db: db_pool.clone(),
            }))
            .service(ping)
            .service(get_tfa_for_user)
    })
    .bind(config.ip_addr.to_string() + ":" + &*config.port.to_string())
    .expect("UNABLE TO ESTABLISH SERVER")
    .run()
    .await
    .unwrap();
}
