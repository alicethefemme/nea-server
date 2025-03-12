use std::sync::Once;
use crate::handlers::authentication::get_tfa_for_user;
use crate::handlers::ping::ping;
use crate::tools::db::DB;
use crate::tools::state::AppState;
use actix_web::{App, HttpServer, web};
use chrono::Utc;
use log4rs::append::rolling_file::policy::compound::CompoundPolicy;
use log4rs::append::rolling_file::policy::compound::trigger::time::{TimeTrigger, TimeTriggerConfig};
use log4rs::append::rolling_file::RollingFileAppender;
use log::info;
use tracing::{error, Level};
use tracing_appender::rolling;
use tracing_subscriber::FmtSubscriber;

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

/// Initialize the loggers and get them ready for use.
fn init_loggers() {
    Once::new().call_once(|| {
        let file_appender = rolling::daily("./logs", "logfile");
        let (non_blocking, _guard) = tracing_appender::non_blocking(file_appender);

        let subscriber = FmtSubscriber::builder()
            .with_max_level(Level::INFO)
            .with_writer(non_blocking)
            .finish();

        tracing::subscriber::set_global_default(subscriber).unwrap();
    });
}
