const router = require('express').Router();
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
})
module.exports = router;