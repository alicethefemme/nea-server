use std::env;
use std::fs::File;
use std::io::Read;
use sha2::digest::Update;
use sha2::{Digest, Sha256};
use warp::{self, http::StatusCode, path, Rejection};
use warp::hyper::body::HttpBody;

pub async fn ping() -> Result<impl warp::Reply, warp::Rejection> {

    // Get hash of current file on system.
    let path_of_current = env::current_exe()?;

    let mut file = File::open(path_of_current)?;
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer)?;

    let mut hasher = Sha256::new();
    hasher.update(&buffer);
    let hash = hasher.finalize();

    Ok(warp::reply::html(hash))
}