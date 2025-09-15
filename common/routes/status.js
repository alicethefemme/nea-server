const router = require("express").Router();
const systeminfo = require("systeminformation");
const jwt = require("jsonwebtoken");

const Config = require("../helpers/config");
const Database = require("../helpers/database");
const version = "0.0.1";

router.get("/", (request, response) => {
  let status = {
    // Create the status JSON object to send back.
    status: "running",
  };
  response.send(status); // Send the response JSON object.
});

router.get("/ver", (request, response) => {
  response.json({ version: version, name: "ServerCmdr" });
});

router.get("/getCpu", async (request, response) => {
  // Check that the user is allowed to get this data.
  const token = request.get("Authorization");

  const thisConfig = new Config();
  const thisDB = new Database();
  const jwtSecret = thisConfig.jwtSecretKey;
  const jwtHashingMethod = thisConfig.jwtHashingMethod;

  try {
    const jwtPayload = await jwt.verify(token, jwtSecret, {
      complete: true,
      algorithms: [jwtHashingMethod],
      issuer: "ServerCmdr",
    });

    // Get the payload for the token.
    const payload = jwtPayload.payload;

    // Check that the user exists and is fully authenticated.
    if (!payload.full_authenticated) {
      console.warn('Unauthorized access attempt');
      return response.status(401);
    }
    if (!thisDB.user_exists(payload.userId)) {
      return response.status(41);
    }

    // Get the current CPU load.
    let currentCPULoad = await systeminfo.currentLoad();

    // Get current date and time using UNIX timestamp.
    var currentDate = new Date();
    const datetime = currentDate.getTime()

    // Add data to the database.
    thisDB.store_system_data(datetime, "CPU_load", Number(currentCPULoad.currentLoad.toFixed(1)));

    // Send the response of the data.
    return response.send({
      datetime: datetime,
      value: Number(currentCPULoad.currentLoad.toFixed(1)),
    });
  } catch (error) {
    console.error(error);
    return response.status(500);
  }
});

router.get("/getCpuHistoric", async (request, response) => {
  // Check that the user is permitted to request this data.
  const token = request.get("Authorization");
  
  const thisConfig = new Config();
  const thisDB = new Database();
  const jwtSecret = thisConfig.jwtSecretKey;
  const jwtHashingMethod = thisConfig.jwtHashingMethod;

  try {
    const jwtPayload = await jwt.verify(token, jwtSecret, {
      complete: true,
      algorithms: [jwtHashingMethod],
      issuer: "ServerCmdr",
    });

    // Get the payload for the token.
    const payload = jwtPayload.payload;

    // Check that the user exists and is fully authenticated.
    if (!payload.full_authenticated) {
      console.warn('Unauthorized access attempt');
      return response.status(401);
    }
    if (!thisDB.user_exists(payload.userId)) {
      return response.status(401);
    }

    // Get the start time from the query string.
    let startTime = request.query.startTime;
    const date = new Date(startTime);

    // Check that the provided date is valid.
    if (date.toString() === "Invalid Date") {
      return response.status(400).send({ error: "Invalid startTime parameter" });
    }

    // Get the historic data from the database.
    let historicData = await thisDB.get_historic_data("CPU_load", startTime.getTime());

    historicData = historicData.map((entry) => {
      return {
        datetime: entry.datetime,
        value: entry.value
      };
    });

    // Send the response of the data.
    return response.send({ historicData: historicData });
  } catch (error) {
    console.error(error);
    return response.status(500);
  }
});
module.exports = router;
