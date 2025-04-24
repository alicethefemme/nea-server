const express = require('express');
const Config = require('./common/helpers/config')
const Database = require('./common/helpers/database')

const app = express(); // Create a new instance of an Express Application.

const statusListener = require('./common/routes/status');
const authListener = require('./common/routes/auth');

app.use(express.json()) // Tell the application to use a JSON body for receiving requests.
// Get the configuration from the local .env file.
const thisConfig = new Config();

// Get the database connection to the local file.
const thisDatabase = new Database();

app.listen(thisConfig.bindPort, thisConfig.bindIp, () => { // Start the server and make it listen on the provided port.
    console.log(`Server started on  ${thisConfig.bindIp}:${thisConfig.bindPort}`);
});

app.use('/status', statusListener); // Use the status listener created in common/routes/status.js
app.use('/auth', authListener(thisDatabase)); // Use the auth listener created in ./common/routes/auth.js
