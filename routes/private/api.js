const {isEmpty} = require("lodash");
const {v4} = require("uuid");
const db = require("../../connectors/db");
const roles = require("../../constants/roles");
const {getSessionToken} = require('../../utils/session')
const {json} = require("express");
const getUser = async function (req) {
    const sessionToken = getSessionToken(req);
    if (!sessionToken) {
        return res.status(301).redirect("/");
    }
    // console.log(sessionToken)
    const user = await db
        .select("*")
        .from("se_project.sessions")
        .where("token", sessionToken)
        .innerJoin(
            "se_project.users",
            "se_project.sessions.userid",
            "se_project.users.id"
        )
        .innerJoin(
            "se_project.roles",
            "se_project.users.roleid",
            "se_project.roles.id"
        )
        .first();

    // console.log("user =>", user);
    user.isNormal = user.roleid === roles.user;
    user.isAdmin = user.roleid === roles.admin;
    user.isSenior = user.roleid === roles.senior;
    // console.log("user =>", user)
    return user;
};

module.exports = function (app) {
    // example
    app.put("/users", async function (req, res) {
        try {
            const user = await getUser(req);
            const users = await db.select('*').from("se_project.users")
            return res.status(200).json(user);
        } catch (e) {
            console.log(e.message);
            return res.status(400).send("Could not get users");
        }
    });

    // Pay for ticket by subscription
    //look through el subscription using el user id
    //check if user has sub, if no sub then no pay.
    //if sub then make ticket! 💪🏽
    app.post("/api/v1/tickets/purchase/subscription", async (req, res) => {
        try {
            //check on user if there exists a subscription under his/her user id
            const user = await getUser(req);
            let userid = user["userid"]
            const userSubscription = await db
                .select('*')
                .from('se_project.subscription')
                .where("userid", '=', userid)

            // console.log(userSubscription)
            // console.log(isEmpty(userSubscription))

            if (isEmpty(userSubscription)) {
                //tru = empty therefore no subscription, false = not empty
                console.log("No subscription.")
                return res.status(400).send(userSubscription)
            } else if (userSubscription[0]['nooftickets'] === 0) {
                //tickets are finished
                console.log("Tickets are finished for subscription, renew the subscription or buy normal ticket.")
                return res.status(400).send(userSubscription)
            } else {

                // get the sub id from the user session and getUser
                // get origin and dest and data from user input
                const subid = userSubscription[0]['id']
                //userSubscription is in an array, so we need to access that array first then access id
                // console.log(userSubscription[0]['id'])
                // console.log(subid)
                const {origin, destination, tripdate} = req.body;

                let newPaymentBySubscription = {
                    origin,
                    destination,
                    userid,
                    subid,
                    tripdate
                };

                const paidBySubscription = await db.insert(newPaymentBySubscription).into("se_project.tickets");

                let newNumOfTickets = userSubscription[0]['nooftickets'] - 1

                let updateTickets = await db("se_project.subscription").where('userid', '=', userid).update({
                    nooftickets: newNumOfTickets
                })

                let ticketid = await db.select('*')
                    .from('se_project.tickets')
                    .where("userid", '=', userid)
                    .andWhere('origin', '=', origin)
                    .andWhere('destination', '=', destination)

                //insert upcoming ride in rides table
                let newRide = await db('se_project.rides').insert({
                    status: 'upcoming',
                    origin: origin,
                    destination: destination,
                    userid: userid,
                    ticketid: ticketid[0]['id'],
                    tripdate: tripdate
                })

                // console.log(newNumOfTickets)
                return res.status(201).json(newPaymentBySubscription);
            }
        } catch (err) {
            console.log("Error paying for ticket by subscription", err.message);
            return res.status(400).send(err.message);
        }
    });


// -Request Senior PUT

    app.put("/api/v1/requests/senior/:requestId", async (req, res) => {
        const {requestId} = req.params;

        let status = await db("se_project.senior_requests")
            .where({id: requestId})
            .select("status")
            .first();

        if (status['status'] === 'accepted') {
            return res.status(400).send("Senior request has already been accepted");
        }
        if (status['status'] === 'rejected') {
            return res.status(400).send("Senior request has already been rejected");
        }

        const existRequest = await db("se_project.senior_requests")
            .where({id: requestId})
            .select("*")
            .first();
        if (!existRequest) {
            return res.status(400).send("Senior request does not exist");
        }
        try {
            const user = await getUser(req);
            // console.log(user)
            const seniorUser = await db.select('*').from('se_project.senior_requests').where('userid', '=', user['userid'])
            console.log(seniorUser)
            let userNID = seniorUser[0]['nationalid'].toString();
            // console.log(userNID)
            if (userNID[0] < 3) {
                let userBYear = parseInt("19" + userNID.substring(1, 3));

                // console.log(userBYear)

                //year has to be less than 63
                thisYear = parseInt(new Date().getFullYear())
                if (thisYear - userBYear >= 60) {
                    //kda checks out and he's a senior
                    status = 'accepted'

                    const updateUserRoleToSenior = await db("se_project.users").where('id', '=', user['userid']).update({
                        roleid: 3
                    })


                } else {
                    status = 'rejected'
                }
            } else {
                status = 'rejected'
            }
            const updateSeniorRequestStatus = await db("se_project.senior_requests")
                .where("id", requestId)
                .update({status: status})
                .returning("*");
            return res.status(200).json(status);

        } catch (err) {
            console.log("error message", err.message);
            return res.status(400).send("Could not update senior request");
        }
    });


    function dijkstra(graph, startNode, destination) {
        const distances = {};
        const visited = {};
        const previous = {};

        // Initialize distances with infinity, except for the startNode which is 0
        for (let node in graph) {
            distances[node] = Infinity;
        }
        distances[startNode] = 0;

        while (true) {
            let closestNode = null;
            let shortestDistance = Infinity;

            // Find the unvisited node with the shortest distance
            for (let node in graph) {
                if (!visited[node] && distances[node] < shortestDistance) {
                    closestNode = node;
                    shortestDistance = distances[node];
                }
            }

            if (closestNode === null || closestNode === destination) {
                break; // No more unvisited nodes or destination reached
            }

            // Mark the node as visited
            visited[closestNode] = true;

            // Update distances to neighboring nodes
            for (let neighbor in graph[closestNode]) {
                let distance = graph[closestNode][neighbor];
                let totalDistance = distances[closestNode] + distance;

                if (totalDistance < distances[neighbor]) {
                    distances[neighbor] = totalDistance;
                    previous[neighbor] = closestNode;
                }
            }
        }

        // Build the shortest path from startNode to destination
        const path = [destination];
        let current = destination;
        while (previous[current]) {
            path.unshift(previous[current]);
            current = previous[current];
        }

        return {distances, path};
    }


    async function shortestPath(origin, destination, distance = []) {
        console.log(1)
        origin = await db.select('*').from("se_project.routes").where("fromstationid", '=', origin[0]);
        console.log(2)
        for (let i = 0; i < origin.length; i++) {
            if (origin[i] === destination) {
                ++distance[i];
            } else {
                if (distance[i] === 0 && distance[0] > 0) {
                    distance[i] = distance[0] - 1;
                }
                distance[i]++;
                return shortestPath(origin[i], destination, distance);
            }
        }
        let shortestSoFar = distance[0];
        for (let i in distance) {
            if (distance[i] < shortestSoFar)
                shortestSoFar = distance[i];
        }
        return shortestSoFar;

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
            console.log(shortestPath(startStation, endStation))

            return res.status(200).send("success")
        } catch (err) {
            console.log("Error checking price", err.message);
            return res.status(400).send(err.message);
        }
    });
    //rewrite all of this to the private api

};

