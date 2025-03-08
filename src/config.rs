use std::fs;

pub struct Config {
    pub metrics: Metrics,
}

pub struct Metrics {
    pub logging_interval: i8,
}

const HEADERS: [&str; 1] = ["METRIC_LOGGING_INTERVAL"];
const SERVER_CONF_FILE_LINK: &str = "abcabc";

impl Config {
    pub fn new(config_file_path: &str) -> Config {
        /// Read the file and check against the predefined headers. If they don't match, replace the original file and throw error.
        env_logger::init();

        match fs::read_to_string(&config_file_path) {
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

                println!("{:?}", keys_vals);

                if !HEADERS.iter().all(|item| {
                    keys_vals
                        .iter()
                        .map(|l| l.split('=').collect::<Vec<&str>>()[0].trim())
                        .collect::<Vec<&str>>()
                        .contains(item)
                }) {
                    // Not all the headers are found.
                    create_config_file(config_file_path);
                }

                let mut config = Config {
                    metrics: Metrics {
                        logging_interval: 0,
                    },
                };

                for item in keys_vals {
                    let l = item.split('=').collect::<Vec<&str>>();

                    let key = l[0].trim();
                    let value = l[1].trim();

                    match key {
                        "METRIC_LOGGING_INTERVAL" => {
                            config.metrics.logging_interval = value.parse::<i8>().unwrap();
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
                create_config_file(config_file_path);
                std::process::exit(1);
            }
        }
    }
}

fn create_config_file(config_file_path: &str) {
    println!("Config file doesn't exist. Downloading now!");
    match fs::write(config_file_path, download_config_file()) {
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

fn download_config_file() -> String {
    let mut downloaded = false;
    let mut response_text = String::from("");

    while !downloaded {
        match reqwest::blocking::get(SERVER_CONF_FILE_LINK) {
            Ok(response) => {
                if !response.status().is_success() {
                    // Sleep 5 secs and retry.
                    println!(
                        "Unable to download the new config file. Waiting, and trying again..."
                    );
                    std::thread::sleep(core::time::Duration::new(5, 0));
                    continue;
                }

                response_text = response.text().unwrap();
                downloaded = true;
            }
            Err(_) => {
                // Unable to make request for some reason.
                println!("Unable to download the new config file. Waiting, and trying again...");
                std::thread::sleep(core::time::Duration::new(5, 0));
                continue;
            }
        }
    }

    response_text
}
