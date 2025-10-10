const express = require('express');
const Config = require('./common/helpers/config')
const Database = require('./common/helpers/database')

const app = express(); // Create a new instance of an Express Application.

// Requirements for HTTPS
const fs = require('fs');
const http = require('http');
const https = require('https');

const statusListener = require('./common/routes/status');
const authListener = require('./common/routes/auth');

app.use(express.json()) // Tell the application to use a JSON body for receiving requests.
// Get the configuration from the local .env file.
const thisConfig = new Config();

// Get the database connection to the local file.
const thisDatabase = new Database();

// Define the endpoints
app.use('/status', statusListener); // Use the status listener created in common/routes/status.js
app.use('/auth', authListener(thisDatabase)); // Use the auth listener created in ./common/routes/auth.js

let httpsEnabled = thisConfig.httpsEnabled;

// Check that the files exist.
httpsEnabled = fs.existsSync(thisConfig.httpsCertFile) && fs.existsSync(thisConfig.httpsCertKey);

if(httpsEnabled) {
    // Ensure the file exists and is valid.
    const sslOptions = {
        key: fs.readFileSync(thisConfig.httpsCertKey),
        cert: fs.readFileSync(thisConfig.httpsCertFile)
    };

    https.createServer(sslOptions, app).listen(thisConfig.bindPort, thisConfig.bindIp, () => {
        console.log(`Https server started on https://${thisConfig.bindIp}:${thisConfig.bindPort}`)
    });
} else {
    http.createServer(app).listen(thisConfig.bindPort, thisConfig.bindIp, () => {
        console.log(`Http server started on http://${thisConfig.bindIp}:${thisConfig.bindPort}`);
    });
}

