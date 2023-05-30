const {isEmpty} = require("lodash");
const {v4} = require("uuid");
const db = require("../../connectors/db");
const roles = require("../../constants/roles");
module.exports = function (app) {
    app.post("/api/v1/user", async function (req, res) {

        // Check if user already exists in the system
        const userExists = await db
            .select("*")
            .from("se_project.users")
            .where("email", req.body.email);
        if (!isEmpty(userExists)) {
            return res.status(400).send("user exists");
        }

        const newUser = {
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            email: req.body.email,
            password: req.body.password,
            roleid: roles.user,
        };
        try {
            const user = await db("se_project.users").insert(newUser).returning("*");

            return res.status(200).json(user);
        } catch (e) {
            console.log(e.message);
            return res.status(400).send("Could not register user");
        }
    });

    // Register HTTP endpoint to create new user
    app.post("/api/v1/user/login", async function (req, res) {
        // get users credentials from the JSON body
        const {email, password} = req.body;
        if (!email) {
            // If the email is not present, return an HTTP unauthorized code
            return res.status(400).send("email is required");
        }
        if (!password) {
            // If the password is not present, return an HTTP unauthorized code
            return res.status(400).send("Password is required");
        }

        // validate the provided password against the password in the database
        // if invalid, send an unauthorized code
        const user = await db
            .select("*")
            .from("se_project.users")
            .where("email", email)
            .first();
        if (isEmpty(user)) {
            return res.status(400).send("user does not exist");
        }

        if (user.password !== password) {
            return res.status(401).send("Password does not match");
        }

        // set the expiry time as 15 minutes after the current time
        const token = v4();
        const currentDateTime = new Date();
        const expiresat = new Date(+currentDateTime + 900000); // expire in 15 minutes

        // create a session containing information about the user and expiry time
        const session = {
            userid: user.id,
            token,
            expiresat,
        };
        try {
            await db("se_project.sessions").insert(session);
            // In the response, set a cookie on the client with the name "session_cookie"
            // and the value as the UUID we generated. We also set the expiration time.
            return res
                .cookie("session_token", token, {expires: expiresat})
                .status(200)
                .send("login successful");
        } catch (e) {
            console.log(e.message);
            return res.status(400).send("Could not register user");
        }
    });

    async function calculateShortestPath(fromStationId, toStationId) {
        const distances = {};
        const previous = {};

        // Fetch all stations from the database
        const stationsQuery = await db.select('se_project.stations') //'SELECT id, stationname FROM stations';
        const {rows: stations} = await pool.query(stationsQuery);

        // Initialize distances with infinity, except for the source station which is 0
        stations.forEach(station => {
            distances[station.id] = station.id === fromStationId ? 0 : Infinity;
        });

        while (true) {
            let closestStationId = null;
            let shortestDistance = Infinity;

            // Find the unvisited station with the shortest distance
            for (let stationId in distances) {
                if (distances[stationId] < shortestDistance && !previous[stationId]) {
                    closestStationId = stationId;
                    shortestDistance = distances[stationId];
                }
            }

            if (closestStationId === null || closestStationId === toStationId) {
                break; // No more unvisited stations or destination reached
            }

            // Fetch routes from the database for the closest station
            const routesQuery =  se_project.routes //'SELECT toStationId FROM routes WHERE fromStationId = $1';
            const {rows: routes} = await pool.query(routesQuery, [closestStationId]);

            // Update distances to neighboring stations
            for (let route of routes) {
                const neighborStationId = route.toStationId;
                const distance = shortestDistance + 1; // Assuming each route has a weight of 1

                if (distance < distances[neighborStationId]) {
                    distances[neighborStationId] = distance;
                    previous[neighborStationId] = closestStationId;
                }
            }
        }

        // Build the shortest path from source to destination
        const path = [toStationId];
        let currentStationId = toStationId;
        while (previous[currentStationId]) {
            path.unshift(previous[currentStationId]);
            currentStationId = previous[currentStationId];
        }

        return {distance: distances[toStationId], path};
    }

// Usage example
    const fromStationId = 1; // Replace with the actual source station ID
    const toStationId = 5; // Replace with the actual destination station ID

    calculateShortestPath(fromStationId, toStationId)
        .then(result => {
            console.log('Shortest distance:', result.distance);
            console.log('Shortest path:', result.path);
        })
        .catch(error => {
            console.error('An error occurred:', error);
        });

}