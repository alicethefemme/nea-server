use std::env;
use actix_web::{get, HttpRequest, HttpResponse, Responder};
use tokio::fs::File;
use tokio::io::AsyncReadExt;
use sha2::{Digest, Sha256};
use hex::encode;

#[get("/api/ping")]
pub async fn ping(_req: HttpRequest) -> impl Responder {
    let current_exe = env::current_exe().unwrap();

    let mut file = File::open(current_exe).await.unwrap();
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer).await.unwrap();

    let mut hasher = Sha256::new();
    hasher.update(&buffer);
    let hash = encode(hasher.finalize());

    HttpResponse::Ok().body(hash)
}