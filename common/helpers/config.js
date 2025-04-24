const fs = require('fs');
const dotenv = require('dotenv');

class Config {
    bindIp;
    bindPort;

    metricLoggingInterval;

    databasePath;

    jwtSecretKey;


    constructor() {
        // TODO: Use all of the configs here from a .ENV file using dotenv modules, instead of reading a custom file.

        // Use dotenv to load the file.
        dotenv.config();

        // Collect together the variables required.
        this.bindIp = (process.env.BIND_IP) ? process.env.BIND_IP : '0.0.0.0';
        this.bindPort = (process.env.BIND_PORT) ? process.env.BIND_PORT : '5000';

        // Metric variables
        this.metricLoggingInterval = (process.env.METRIC_LOGGING_INTERVAL) ? process.env.METRIC_LOGGING_INTERVAL : '5';

        // Storage variables
        this.databasePath = (process.env.DATABASE_PATH) ? process.env.DATABASE_PATH : './database.db';

        // JSON Web Token variables.
        this.jwtSecretKey = (process.env.JSON_SECRET_KEY) ? process.env.JSON_SECRET_KEY : 'ThisIsASuperSecureAndSecretKey';


    }
}

module.exports = Config;