const fs = require('fs');
const dotenv = require('dotenv');

class Config {
    bindIp;
    bindPort;

    httpsEnabled;
    httpsCertFile;
    httpsCertKey;

    metricLoggingInterval;

    databasePath;

    jwtSecretKey;
    jwtHashingMethod;

    yubicoClientId;
    yubicoSecret;


    constructor() {
        // Use dotenv to load the file.
        dotenv.config();

        // Collect together the variables required.
        this.bindIp = (process.env.BIND_IP) ? process.env.BIND_IP : '0.0.0.0';
        this.bindPort = (process.env.BIND_PORT) ? process.env.BIND_PORT : '5000';

        // Files to enable HTTPS.
        this.httpsEnabled = (!!process.env.HTTPS_CERT_FILE) && (!!process.env.HTTPS_CERT_KEY);
        this.httpsCertFile = process.env.HTTPS_CERT_FILE;
        this.httpsCertKey = process.env.HTTPS_CERT_KEY;

        // Metric variables
        this.metricLoggingInterval = (process.env.METRIC_LOGGING_INTERVAL) ? process.env.METRIC_LOGGING_INTERVAL : '5';

        // Storage variables
        this.databasePath = (process.env.DATABASE_PATH) ? process.env.DATABASE_PATH : './database.db';

        // JSON Web Token variables.
        this.jwtSecretKey = (process.env.JSON_SECRET_KEY) ? process.env.JSON_SECRET_KEY : 'ThisIsASuperSecureAndSecretKey';
        this.jwtHashingMethod = (process.env.JSON_HASHING_METHOD) ? process.env.JSON_HASHING_METHOD: 'HS256';

        // Yubico API
        this.yubicoClientId = (process.env.YUBICO_API_CLIENT_ID) ? process.env.YUBICO_API_CLIENT_ID : null;
        this.yubicoSecret = (process.env.YUBICO_API_SECRET) ? process.env.YUBICO_API_SECRET : null;


    }
}

module.exports = Config;