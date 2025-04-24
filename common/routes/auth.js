const Database = require("../helpers/database");
const Config = require("../helpers/config");
const jwt = require("jsonwebtoken");
module.exports = (db) => {
    const router = require('express').Router();
    const jwt = require('jsonwebtoken');

    const Config = require('../helpers/config');

    router.get('/get_token', async(request, response) => {
        const username = request.query.username; // Get the username from the request.
        const password = request.query.password; // Gets the password from the request.
        const tfa_code = request.query.tfaCode; // Gets the two-factor code from the query.

        // Check if the username or password is null. If so, return error.
        if(username === undefined || password === undefined) {
            return response.status(400).json({error: 'Missing username or password parameters'});
        }

        // Check if the user exists in the database.
        const user = db.get_user(username);
        if(user === undefined) {
            return response.status(400).json({error: 'Invalid username or password parameters'});
        }

        // User exists. Check if password is correct.
        const userId = user.id;
        const passwordValid = await db.check_user_password(userId, password);
        console.log(passwordValid);
        if(!passwordValid) {
            //TODO: FIGURE OUT WHY THIS CODE ISN'T RUNNING IN ORDER
            return response.status(400).json({error: 'Invalid username or password parameters'});
        }

        // TODO: Query database for user TFA method. If method is applied, inform user of tfa method.

        const thisConfig = new Config();
        const secret_key = thisConfig.jwtSecretKey;


        const payload = {
            userId: 1,
            username: username
        };
        return response.status(200).json({
            token: jwt.sign(payload, secret_key, {
                expiresIn: '1h',
                algorithm: 'HS256' // Default and safe. // TODO: Make this configurable.
            })
        });
    });

    return router;

// TODO: Look into creating encrypted JWT's here so that the client and server security can be upgraded. Ensure the user is running over HTTPS.
};