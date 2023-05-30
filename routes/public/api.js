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
        const stations = await db('se_project.stations').select('id', 'stationname');

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
            const routes = await db('se_project.routes').select('tostationid').where('fromstationid', '=', closestStationId);

            // Update distances to neighboring stations
            for (let route of routes) {
                const neighborStationId = route.tostationid;
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

    //calculate the price of ride from origin to destination
    //notice that the price will differ.. if user is a subscriber, then it'll cost 1 ticket, else if is senior then apply discount
    //---------------------------------------------------------------------------
    // Check Price:
    app.post("/api/v1/tickets/price/:originId/:destinationId", async (req, res) => {
        // < 9 stations = 5 gneh,
        // 10 - 16 stations = 7 gneh
        // > 16 stations = 10 gneh
        // 50% discount law senior
        //
        //run shortest path algo
        //select the stations and save them in an array, select the routes and save them in an array, and select the stations routes and save them in an array,
        //we need to mark where we can start.
        // https://www.geeksforgeeks.org/implementation-graph-javascript/
        // https://github.com/dagrejs/graphlib/wiki
        // https://www.npmjs.com/package/graphlib?activeTab=readme
        //i changed the link while testing cuz i think it wasnt working but give the original a try it's: /api/v1/tickets/price/:originId& :destinationId
        try {
            const {originId, destinationId} = req.params;
            let startStation = await db.select('*').from("se_project.stations").where('id', '=', originId);
            let endStation = await db.select('*').from("se_project.stations").where('id', '=', destinationId);

            //calculate the shortest path
            let shortestPath = await calculateShortestPath(startStation, endStation);

            console.log(shortestPath)
            console.log(shortestPath.path)


            return res.status(200).send("success")
        } catch (err) {
            console.log("Error checking price", err.message);
            return res.status(400).send(err.message);
        }
    });

}