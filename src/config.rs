use std::net::IpAddr;

pub struct Config {
    pub ip_addr: IpAddr,
    pub port: i32,
    pub database_path: String,
    pub metrics: Metrics,
}

pub struct Metrics {
    pub logging_interval: i8,
}

const HEADERS: [&str; 4] = ["bind_ip", "bind_port", "metric_logging_interval", "database_path"];
const SERVER_CONF_FILE_LINK: &str = "https://raw.githubusercontent.com/alicethefemme/nea-server/15f461b/server.conf";

impl Config {
    pub async fn new(config_file_path: &str) -> Config {
        /// Read the file and check against the predefined headers. If they don't match, replace the original file and throw error.


        env_logger::init();

        match tokio::fs::read_to_string(&config_file_path).await {
            Ok(content) => {
                // If reading the file is successful.
                let lines = content.split('\n').collect::<Vec<&str>>();

                let keys_vals = lines
                    .iter()
                    .filter_map(|l| {
                        let line = l.split('=').collect::<Vec<&str>>()[0].trim();
                        return if !(line.starts_with('#') || line.is_empty()) {
                            Some(l)
                        } else {
                            None
                        };
                    })
                    .collect::<Vec<&&str>>();

                if !HEADERS.iter().all(|item| {
                    keys_vals
                        .iter()
                        .map(|l| l.split('=').collect::<Vec<&str>>()[0].trim())
                        .collect::<Vec<&str>>()
                        .contains(item)
                }) {
                    // Not all the headers are found.
                    create_config_file(config_file_path).await;
                }

                let mut config = Config {
                    ip_addr: IpAddr::V4("0.0.0.0".parse().unwrap()),
                    port: 8080,
                    database_path: "./database.db".parse().unwrap(),
                    metrics: Metrics {
                        logging_interval: 0,
                    },
                };

                for item in keys_vals {
                    let l = item.split('=').collect::<Vec<&str>>();

                    let key = l[0].trim();
                    let value = l[1].trim();

                    //TODO: Update changes to check value types for options.
                    match key {
                        "bind_ip" => {
                            let items = value.split(".").map(|i| i.trim().parse::<u8>().unwrap()).collect::<Vec<u8>>();

                            if items.len() != 4 {
                                panic!("Unable to read ip_addr. Please format in 0.0.0.0 where 0 can be between 0 and 255.")
                            }

                            for item in items {
                                if item<0 || item>255 {
                                    panic!("Unable to read ip_addr. Please format in 0.0.0.0 where 0 can be between 0 and 255.")
                                }
                            }

                            config.ip_addr = IpAddr::V4(value.parse().unwrap());
                        },
                        "bind_port" => {
                            match value.parse::<i32>() {
                                Ok(port) => {
                                    if port<1 || port>65535 {
                                        panic!("Unable to read port. Please ensure it is a number between 1 and 65535.")
                                    }

                                    config.port = port;
                                }
                                Err(_) => {panic!("Unable to read port. Please ensure it is a number between 1 and 65535.")}
                            }
                        }
                        "metric_logging_interval" => {
                            config.metrics.logging_interval = value.parse::<i8>().unwrap();
                        }
                        "database_path" => {
                            config.database_path = value.parse().unwrap();
                        }
                        &_ => {
                            println!(
                                "WARNING: Config has item {:?} with value {:?} that is unassigned.",
                                key, value
                            )
                        }
                    }
                }
                config
            }
            Err(_) => {
                // File doesn't exist or error reading file as invalid format. Process to download new file.
                create_config_file(config_file_path).await;
                std::process::exit(1);
            }
        }
    }
}

async fn create_config_file(config_file_path: &str) {
    println!("Config file doesn't exist. Downloading now!");
    match tokio::fs::write(config_file_path, download_config_file().await).await {
        Ok(_) => {
            println!("Wrote default config file! Exiting program now.");
            std::process::exit(1);
        }
        Err(_) => {
            panic!(
                "Unable to write config file! Please download this from {:?}",
                SERVER_CONF_FILE_LINK
            );
        }
    }
}

async fn download_config_file() -> String {
    let mut downloaded = false;
    let mut response_text = String::from("");

    while !downloaded {
        match reqwest::get(SERVER_CONF_FILE_LINK).await {
            Ok(response) => {
                if !response.status().is_success() {
                    // Sleep 5 secs and retry.
                    println!(
                        "Unable to download the new config file. Waiting, and trying again..."
                    );
                    tokio::time::sleep(core::time::Duration::new(5, 0)).await;
                    continue;
                }

                response_text = response.text().await.unwrap();
                downloaded = true;
            }
            Err(_) => {
                // Unable to make request for some reason.
                println!("Unable to download the new config file. Waiting, and trying again...");
                tokio::time::sleep(core::time::Duration::new(5, 0)).await;
                continue;
            }
        }
    }

    response_text
}
