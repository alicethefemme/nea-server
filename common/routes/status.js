const router = require('express').Router();
const systeminfo = require('systeminformation');
const jwt = require('jsonwebtoken');

const Config = require("../helpers/config");
const Database = require('../helpers/database');
const version = '0.0.1';

router.get('/', (request, response) => {
    let status = { // Create the status JSON object to send back.
        'status': 'running'
    }
    response.send(status); // Send the response JSON object.
});

router.get('/ver', (request, response) => {
    response.send({
        version: version
    })
});

router.get('/cpu', async (request, response) => {
    // Check that the user is allowed to get this data.
    const token = request.get('Authorization');

    const thisConfig = new Config();
    const thisDB = new Database();
    const jwtSecret = thisConfig.jwtSecretKey;
    const jwtHashingMethod = thisConfig.jwtHashingMethod;

    try {
        const jwtPayload = await jwt.verify(token, jwtSecret, {
            complete: true,
            algorithms: [jwtHashingMethod],
            issuer: 'ServerCmdr'
        });

        const payload = jwtPayload.payload;

        if(!payload.full_authenticated) {
            return response.status(401);
        }
        if(!thisDB.user_exists(21312323231232)) {
            return response.status(69);
        }

        let currentCPULoad = await systeminfo.currentLoad()

        return response.send({
            currentCPULoad: Number(currentCPULoad.currentLoad.toFixed(1))
        })
    } catch (error) {
        return response.status(500);
    }
})
module.exports = router;