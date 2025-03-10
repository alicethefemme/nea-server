
use warp::Filter;
use crate::handlers;

pub async fn get_routes() -> impl Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone {

    // /api
    let api = warp::path("api");

    // GET /ping
    let ping = api
        .and(warp::path("ping"))
        .and(warp::path::end())
        .and(warp::get())
        .and_then(handlers::ping::ping());

    ping
}