const Database = require("../helpers/database");
const Config = require("../helpers/config");
const jwt = require("jsonwebtoken");
const yub = require('yub');
const twoFactor = require('node-2fa');

module.exports = (db) => {
    const router = require('express').Router();
    const jwt = require('jsonwebtoken');

    const Config = require('../helpers/config');

    /**
     * /auth/get_token endpoint.
     * Returns:
     *  - (200) with headers: status (0 for invalid credentials, 1 for valid and successful login, 2 for requires TFA), [OPTIONAL] method (email, authenticator, yubikey), [OPTIONAL] token
     *  - (400) with headers: error (Missing username or password parameters)
     *  - (401)
     */
    router.get('/login', async(request, response) => {
        const username = request.query.username; // Get the username from the request.
        const password = request.query.password; // Gets the password from the request.

        // Check if the username or password is null. If so, return 0.
        if(username === undefined || password === undefined) {
            return response.status(400).json({error: 'Missing username or password parameters'});
        }

        // Check if the user exists on the server.
        const userId = db.get_user(username);
        if(!userId) {
            return response.status(401);
        }
        const passwordValid = db.check_user_password(userId, password);
        if(!passwordValid) {
            return response.status(401);
        }

        // Get the requirements to make JWT.
        const thisConfig = new Config();
        const secret_key = thisConfig.jwtSecretKey;

        // Check if the user account has TFA enabled.
        const tfa_enabled = db.get_tfa_status(userId);

        // TODO: Create level 1 token here with response.
        if(tfa_enabled) {
            let tfa_method = db.get_tfa_method(userId);

            // Error occurred (failed TFA setup for account?)
            if(!tfa_method) return response.status(500);

            const jwt_payload = {
                userId: userId,
                full_authenticated: false,
                tfa_authenticated: true,
                permissions: []
            }

            const jwt_token = jwt.sign(jwt_payload, secret_key, {
                expiresIn: '1h',
                algorithm: thisConfig.jwtHashingMethod,
                issuer: 'ServerCmdr'
            })

            return response.status(200).json({
                token: jwt_token,
                method: tfa_method
            });
        } else {
            // Create the token.
            const jwt_payload = {
                userId: userId,
                full_authenticated: true,
                tfa_authenticated: false,
                permissions: []
            }
            const jwt_token = jwt.sign(jwt_payload, secret_key, {
                expiresIn: '1h',
                algorithm: thisConfig.jwtHashingMethod,
                issuer: 'ServerCmdr'
            });

            // Respond to the user.
            return response.status(200).json({
                token: jwt_token
            });
        }
    });

    router.get('/tfa_login', async(request, response) => {
        const token = request.get('Authorization');
        const code = request.query.code;

        // Get config for JWT Secrets
        const thisConfig = new Config();
        const jwtSecret = thisConfig.jwtSecretKey;
        const jwtHashingMethod = thisConfig.jwtHashingMethod;

        // Connect to the database.
        const thisDB = new Database();

        try {
            // Check token for validity
            const jwtPayload = jwt.verify(token, jwtSecret, {
                complete: true,
                algorithms: [jwtHashingMethod],
                issuer: 'ServerCmdr'});

            const payload = jwtPayload.payload;

            if (payload.full_authenticated) {
                // Nothing needs doing if the user is fully authenticated
                return response.status(400);
            }

            if(!code) {
                // No code has been provided.
                return response.status(400).json({status: 'Missing \'code\' query.'})
            }

            const tfaMethodForAccount = thisDB.get_tfa_method(payload.userId);

            //TODO: Move payload generation up here, make a call to get the permissions for the user to provide in the JWT.

            switch (tfaMethodForAccount) {
                case 'yubikey': {
                    // Yubikey based authentication is being used.
                    const yubikey_client_id = thisConfig.yubicoClientId;
                    const yubikey_secret = thisConfig.yubicoSecret;

                    if(!yubikey_client_id || !yubikey_secret) {
                        // There is no client ID or secret. Throw an error.
                        return response.status(500);
                    }

                    // Initialise the API to connect to the Yubikey Server
                    try {
                        yub.init(yubikey_client_id, yubikey_secret);
                    } catch (err) {
                        return response.code(500);
                    }

                    // Verify the key
                    return yub.verify(code, (err, data) => {
                        if(err) return response.code(500);

                        // Checks if the Yubikey servers authenticated the provided OTP correctly.
                        if(!data.valid) return response.code(401);

                        const yubikeyUserSecret = thisDB.get_tfa_secret(payload.userId);
                        if(!yubikeyUserSecret) return response.code(500);

                        if(data.identity !== yubikeyUserSecret) return response.code(401);

                        // Yay! The Yubikey is valid, and belongs to this user. Return the JWT.
                        try {
                            const returnJwtPayload = {
                                userId: payload.userId,
                                full_authenticated: true,
                                tfa_authenticated: true,
                                permissions: []
                            }

                            const jwt_token = jwt.sign(returnJwtPayload, jwtSecret, {
                                expiresIn: '1h',
                                algorithm: thisConfig.jwtHashingMethod,
                                issuer: 'ServerCmdr'
                            });

                            return response.code(200).json({token: jwt_token})


                        } catch (error) {
                            return response.code(500);
                        }
                    })
                }
                case 'auth_code': {
                    // User is using a code from their TFA app.
                    const authCodeSecret = thisDB.get_tfa_secret(payload.userId);

                    const status = twoFactor.verifyToken(authCodeSecret, code, 2);

                    // Check if there is a valid two-factor code provided
                    if(!status) return response.code(401);

                    // Check that the code is the right code provided at the right time.
                    if(status.delta !== 0) return response.code(401);

                    try {
                        const jwt_payload = {
                            userId: payload.userId,
                            full_authenticated: true,
                            tfa_authenticated: true,
                            permissions: []
                        }

                        const jwt_token = jwt.sign(jwt_payload, jwtSecret, {
                            expiresIn: '1h',
                            algorithm: thisConfig.jwtHashingMethod,
                            issuer: 'ServerCmdr'
                        });

                        return response.code(200).json({token: jwt_token});
                    } catch (err) {
                        return response.code(500);
                    }

                } case 'email_code': {
                    // User is using a code from an email. Check code for validity.
                    const codeValid = thisDB.check_email_tfa_code(code, payload.userId);

                    if(!codeValid) return response.status(401);

                    try {
                        const jwt_payload = {
                            userId: payload.userId,
                            full_authenticated: true,
                            tfa_authenticated: true,
                            permissions: []
                        }
                    } catch (err) {
                        return response.code(500);
                    }
                }
            }

        } catch (err) {
            return response.status(401);
        }

    })

    // USED FOR TESTING. GOOD IDEA TO USE FOR CREATING AN ACCOUNT.
    // router.put('/create_user_password', async(request, response) => {
    //    const username = request.query.username;
    //    const password = request.query.password;
    //
    //    // Create the details in DB.
    //    await db.create_user(username, password);
    //    return response.status(200).json('success');
    // });

    return router;

// TODO: Look into creating encrypted JWT's here so that the client and server security can be upgraded. Ensure the user is running over HTTPS.
};