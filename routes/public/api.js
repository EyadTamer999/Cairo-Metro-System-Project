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
        /*

        // Using the above implemented graph class
        var g = new Graph(6);
        var vertices = [ 'A', 'B', 'C', 'D', 'E', 'F' ];

        // adding vertices
        for (var i = 0; i < vertices.length; i++) {
            g.addVertex(vertices[i]);
        }

        // adding edges
        g.addEdge('A', 'B');
        g.addEdge('A', 'D');
        g.addEdge('A', 'E');
        g.addEdge('B', 'C');
        g.addEdge('D', 'E');
        g.addEdge('E', 'F');
        g.addEdge('E', 'C');
        g.addEdge('C', 'F');

        // prints all vertex and
        // its adjacency list
        // A -> B D E
        // B -> A C
        // C -> B E F
        // D -> A E
        // E -> A D F C
        // F -> E C
        g.printGraph();

        */
        //i changed the link while testing cuz i think it wasnt working but give the original a try it's: /api/v1/tickets/price/:originId& :destinationId
        try {
            const {originId, destinationId} = req.params;
            const existStation1 = await db.select("id").from("se_project.stations").where("id", originId);
            const existStation2 = await db.select("id").from("se_project.stations").where("id", destinationId);
            if (!existStation1) {
                return res.status(404).send("Origin station doesn't exist");
            } else if (!existStation2) {
                return res.status(404).send("Destination station doesn't exist");
            } else {
                const routeId = await db('stationroutes')
                    .where('stationid', originId)
                    //   .where('stationid', destinationId)
                    .select('routeid')
                    .first();


                const stationCount = await db('stationroutes')
                    .where('routeid', routeId)
                    .count();

                if (stationCount == 9) {
                    price = await db('zones')
                        .where('zonetype', '9')
                        .select('price')
                } else if (stationCount >= 10 && stationCount < 16) {
                    price = await db('zones')
                        .where('zonetype', '10-16')
                        .select('price')

                } else if (stationCount == 16) {
                    price = await db('zones')
                        .where('zonetype', '16')
                        .select('price')

                } else {
                    console.log("Error matching stations with price", err.message);
                    return res.status(400).send(err.message);

                }

                return res.status(201).send(price);
            }
        } catch (err) {
            console.log("Error checking price", err.message);
            return res.status(400).send(err.message);
        }
    });
}