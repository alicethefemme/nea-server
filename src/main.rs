mod config;

fn main() {
    println!("SERVER COMMANDER");

    println!("Getting config...");
    let config = config::Config::new("path_to_config");
}
