const Database = require("../helpers/database");
const Config = require("../helpers/config");
const jwt = require("jsonwebtoken");
module.exports = (db) => {
    const router = require('express').Router();
    const jwt = require('jsonwebtoken');

    const Config = require('../helpers/config');

    /**
     * /auth/get_token endpoint.
     * Returns:
     *  - (200) with headers: status (0 for invalid credentials, 1 for valid and successful login, 2 for requires TFA), [OPTIONAL] method (email, authenticator, yubikey), [OPTIONAL] token
     */
    router.get('/get_token', async(request, response) => {
        const username = request.query.username; // Get the username from the request.
        const password = request.query.password; // Gets the password from the request.
        const tfa_code = !!request.query.tfa_code;

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
        if(!passwordValid) {
            return response.status(400).json({error: 'Invalid username or password parameters'});
        }

        // Get the requirements to make JWT.
        const thisConfig = new Config();
        const secret_key = thisConfig.jwtSecretKey;

        // TODO: Check DB for if the user is authenticated.
        const tfa_enabled = db.get_tfa_status(userId);

        if(tfa_enabled && !tfa_code) {
            // User is connected, and has a TFA enabled account, but has not provided their method.
            return response.status(200).json({
                status: 2,
                method: ''
            });
        } else if (tfa_enabled && tfa_code) {
            // User is connected and has provided a TFA code.
            // TODO: CHECK CODE.
        } else {
            // User doesn't have tfa. Authenticated.

            const jwt_payload = {
                userId: userId,
                username: username,
                authenticated: true
            }
            const jwt_token = jwt.sign(jwt_payload, secret_key, {
                expiresIn: '1h',
                algorithms: 'HS256' // TODO: MAKE THIS CONFIGURABLE
            });

            return response.status(200).json({
                status: 1,
                token: jwt_token
            });
        }

        // Create the token for the user.
        const payload = {
            userId: 1,
            username: username,
            authenticated: true
        };
        return response.status(200).json({
            token: jwt.sign(payload, secret_key, {
                expiresIn: '1h',
                algorithm: 'HS256' // Default and safe. // TODO: Make this configurable.
            })
        });
    });

    router.put('/create_user_password', async(request, response) => {
       const username = request.query.username;
       const password = request.query.password;

       // Create the details in DB.
       await db.create_user(username, password);
       return response.status(200).json('success');
    });

    return router;

// TODO: Look into creating encrypted JWT's here so that the client and server security can be upgraded. Ensure the user is running over HTTPS.
};