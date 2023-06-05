const {isEmpty} = require("lodash");
const date = require('date-and-time');//run this command before starting the server npm install date-and-time
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
            // const {userId}=req.body
            console.log("hiiiiiiiiiii");
            const users = await db.select('*').from("se_project.users")

            return res.status(200).json(users);
        } catch (e) {
            console.log(e.message);
            return res.status(400).send("Could not get users");
        }
    });


    // Simulate Ride
    app.put("/api/v1/ride/simulate", async (req, res) => {
        try {
            const {origin, destination, tripdate} = req.body;
            const simulatedRide = await db('se_project.rides')
                .where("destination", destination)
                .where("origin", origin)
                .where("tripdate", tripdate)
                .update("status", 'completed')
                .returning("*");
            if (isEmpty(simulatedRide)) {
                console.log("Ride does not exist");
                return res.status(400).send("Ride does not exist");
            }
            console.log("Ride simulated successfully");
            return res.status(200).json(simulatedRide);
        } catch (err) {
            console.log("Error simulating ride", err.message);
            return res.status(400).send("Error simulating ride, please make sure inputs are correct");
        }
    })

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


            const subid = userSubscription[0]['id']
            //userSubscription is in an array, so we need to access that array first then access id
            // console.log(userSubscription[0]['id'])
            // console.log(subid)


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


                const {origin, destination, tripdate} = req.body;

                let newPaymentBySubscription = {
                    origin,
                    destination,
                    userid,
                    subid,
                    tripdate
                };


                const ticket_cost = 0;//TODO call CheckPrice
                const origin_id = await db.select("id").from('se_project.stations').where('stationname', origin);
                const des_id = await db.select("id").from('se_project.stations').where('stationname', destination);
                console.log("ya ana mabdoon");
                const origin_id_int = origin_id[0]['id'];
                const des_id_int = des_id[0]['id'];


                console.log(des_id_int);

                console.log(origin_id_int);
                console.log("ya ana mabdoon");

                if (!isEmpty(origin_id) && !isEmpty(des_id)) {
                    const potential_routs_data = await db.select("*").from('se_project.routes').where('tostationid', des_id_int).where('fromstationid', origin_id_int);//ret2

                    let ticket_cost = await Get_price(origin_id_int, des_id_int);


                    const t = "transfer";

                    const transfer_stations = await db.select("stationname").from('se_project.stations').where('stationtype', t);//ret3


                    ////////////////////////////////////////////////////
                    // current date problem in date time methods

                    let date1 = new Date(tripdate);
                    // adjust 0 before single digit date
                    let date = ("0" + date1.getDate()).slice(-2);

                    // current month
                    let month = ("0" + (date1.getMonth() + 1)).slice(-2);

                    // current year
                    let year = date1.getFullYear();

                    // current hours
                    let hours = date1.getHours();

                    // current minutes
                    let minutes = date1.getMinutes();

                    // current seconds
                    let seconds = date1.getSeconds();


                    let up_date_bound = new Date();
                    up_date_bound.setFullYear(year);
                    up_date_bound.setMonth(month);
                    up_date_bound.setDate(date);
                    up_date_bound.setHours(23);
                    up_date_bound.setMinutes(59);
                    up_date_bound.setSeconds(59);

                    /*knex.raw(
                    'select * from users where first_name is null'
                    ),*/
                    //const todayCloseDate = DF.format(new Date(), 'yyyy-MM-dd');

                    const upcome_rides = await db.select("*").from('se_project.rides')
                        .where('tripdate', '>', tripdate)
                        .where('tripdate', '<', up_date_bound);
                    //TODO ret4 not finished  .where('published_date', '<', 2000)

                    //  { tripdate >= currentdate}
                    //1-full ticket price, check price
                    //2-route
                    //3-transfer stations,
                    //4-upcoming ride on the date of the ticket


                    //  { tripdate >= currentdate}
                    //1-full ticket price, check price
                    //2-route
                    //3-transfer stations,
                    //4-upcoming ride on the date of the ticket

                    const ret = {ticket_cost, potential_routs_data, transfer_stations, upcome_rides};//and add the pricecheck price ,upcome_rides
                    return res.status(201).json(ret);

                } else {
                    return res.status(400).send("origin or destination is invalid station");

                }
            }
        } catch (err) {
            console.log("Error paying for ticket by subscription", err.message);
            return res.status(400).send(err.message);
        }
    });


//reset password for admin and user PUT
    app.put("/api/v1/password/reset",
        async (req, res) => {
            try {
                const pass = req.body.password;
                const user = await getUser(req);
                const id = user.userid;
                const old_pass = user.password;

                if (pass === old_pass) {
                    return res.status(400).send("you are entering your old password");

                } else if (pass === "") {
                    return res.status(400).send("you have to enter a value to the password");

                } else {

                    await db('se_project.users').where('id', id).update({password: pass});
                    const user1 = await db.select("*").from('se_project.users').where('id', id);
                    return res.status(201).json(user1);

                }
            } catch (e) {
                console.log("Could not change password", e.message);
                return res.status(400).send(e.message);
            }
        }
    );


//            const user = await db("se_project.users").insert(newUser).returning("*");
//done
//GET subscribtion GET zones Data
    app.get("/api/v1/zones",
        async (req, res) => {
            try {
                const all_zones = await db.select("*").from('se_project.zones').returning("*");
                return res.status(200).json(all_zones);
            } catch (e) {
                console.log("Could not get zones", e.message);
                return res.status(400).send(e.message);
            }

        }
    );


    function get_num_of_tickets(subType) {
        if (subType == "quarterly")
            return 50;
        else if (subType == "annual")
            return 100;
        else if (subType == "month")
            return 10;

    }


    app.post("/api/v1/payment/subscription",
        async (req, res) => {
            try {
                const creditCardNumber = req.body.creditCardNumber;
                const holderName = req.body.holderName;
                let payedAmount = req.body.payedAmount;
                const subType = req.body.subType;
                const zoneId = req.body.zoneId;

                const num_of_tickets = get_num_of_tickets(subType);
                const user = await getUser(req);
                const uid = user.userid;
                const existZone = await db.select("*").from("se_project.zones")
                    .where({id: zoneId});

                if (user.isSenior) {
                    payedAmount = payedAmount * 0.9;
                }
                if (isEmpty(existZone)) {
                    return res.status(400).send("Zone does not exist");
                } else if (creditCardNumber === null) {
                    return res.status(400).send("you must entered creditCardNumber");
                } else if (holderName === null) {
                    return res.status(400).send("you must enter the name of credit Card holder");
                } else if (payedAmount === null) {
                    return res.status(400).send("you must enter the paid amount");
                } else if (subType != "annual" && subType != "month" && subType != "quarterly") {
                    return res.status(400).send("you entered invalid subscription type you have only 3 types which are quarterly , month and annual");
                } else {

                    const ret1 = await db('se_project.subscription').insert({
                        subtype: subType,
                        zoneid: zoneId,
                        nooftickets: num_of_tickets,
                        userid: uid
                    }).returning("*");


                    const id_trip = Number(ret1[0]["id"]);

                    const ret2 = await db('se_project.transactions').insert({
                        amount: payedAmount,
                        userid: uid,
                        purchasedid: toString(id_trip),
                        purchasetype: "subscription"

                    }).returning("*");


                    const ret3 = await db('se_project.creditcarddetails').insert({
                        holder_name: holderName,
                        userid: uid,
                        creditcardnumber: creditCardNumber


                    }).returning("*");


                    const ret = {num_of_tickets};//and add the pricecheck price ,upcome_rides
                    return res.status(201).json(ret);

                }


            } catch (e) {
                console.log("Could not buy online subscription", e.message);
                return res.status(400).send(e.message);
            }
        }
    );
//POST pay for ticket online


//paying for tickets online need work
    app.post("/api/v1/payment/ticket",
        async (req, res) => {
            try {


                const {
                    creditCardNumber,//Integer
                    holderName,//string
                    payedAmount,//integer

                    origin,//string
                    destination,//string
                    tripDate //dateTime
                } = req.body;

                const user = await getUser(req);
                const uid = user.userid;
                console.log("dammmmm1");
                const origin_id = await db.select("id").from('se_project.stations').where('stationname', origin);
                const des_id = await db.select("id").from('se_project.stations').where('stationname', destination);
                console.log(origin_id);
                let ticket_cost = 0;
                if (isEmpty(des_id) || isEmpty(origin_id)) {
                    return res.status(400).send("invalid destination or origin ");

                } else {

                    const origin_id_int = origin_id[0]['id'];

                    const des_id_int = des_id[0]['id'];

                    ticket_cost = await Get_price(origin_id_int, des_id_int);

                    const existsubsription = await db.select("*").from("se_project.subscription").where('userid', uid);
                    if (!isEmpty(existsubsription)) {
                        return res.status(400).send("user have subscription");

                    } else {


                        if (creditCardNumber === null) {
                            return res.status(400).send("you must entered creditCardNumber");
                        } else if (holderName === null) {
                            return res.status(400).send("you must enter the name of credit Card holder");
                        } else if (destination == origin) {
                            return res.status(400).send("invalid trip");
                        } else if (payedAmount === null) {
                            return res.status(400).send("you must enter the paid amount");
                        } else if (tripDate === null) {
                            return res.status(400).send("you must enter the trip date");

                        } else if (origin === "") {
                            return res.status(400).send("you must enter the origin");

                        } else if (destination === "") {
                            return res.status(400).send("you must enter the destination");

                        }

                        //TODO checkprice before inserting
                        if (ticket_cost <= payedAmount) {

                            const ret1 = await db('se_project.tickets').insert({
                                origin: origin,
                                destination: destination,
                                subid: null,//as we are paying online without subscription
                                userid: uid,
                                tripdate: tripDate


                            }).returning("*");


                            const id_trip = Number(ret1[0]["id"]);

                            const ret2 = await db('se_project.transactions').insert({
                                amount: payedAmount,
                                userid: uid,
                                purchasedid: toString(id_trip),
                                purchasetype: "ticket"


                            }).returning("*");


                            const ret3 = await db('se_project.creditcarddetails').insert({
                                holder_name: holderName,
                                userid: uid,
                                creditcardnumber: creditCardNumber


                            }).returning("*");


                            const ret4 = await db('se_project.rides').insert({
                                status: "activated",
                                origin: origin,
                                destination: destination,
                                userid: uid,
                                ticketid: id_trip,
                                tripdate: tripDate

                            }).returning("*");

                            //TODO call CheckPrice

                            console.log(des_id_int);

                            console.log(origin_id_int);
                            console.log("ya ana mabdoon");

                            if (!isEmpty(origin_id) && !isEmpty(des_id)) {
                                const potential_routs_data = await db.select("*").from('se_project.routes').where('tostationid', des_id_int).where('fromstationid', origin_id_int);//ret2


                                const t = "transfer";

                                const transfer_stations = await db.select("stationname").from('se_project.stations').where('stationtype', t);//ret3


                                ////////////////////////////////////////////////////
                                // current date problem in date time methods

                                let date1 = new Date(tripDate);
                                // adjust 0 before single digit date
                                let date = ("0" + date1.getDate()).slice(-2);

                                // current month
                                let month = ("0" + (date1.getMonth() + 1)).slice(-2);

                                // current year
                                let year = date1.getFullYear();

                                // current hours
                                let hours = date1.getHours();

                                // current minutes
                                let minutes = date1.getMinutes();

                                // current seconds
                                let seconds = date1.getSeconds();


                                let up_date_bound = new Date();
                                up_date_bound.setFullYear(year);
                                up_date_bound.setMonth(month);
                                up_date_bound.setDate(date);
                                up_date_bound.setHours(23);
                                up_date_bound.setMinutes(59);
                                up_date_bound.setSeconds(59);

                                /*knex.raw(
                                'select * from users where first_name is null'
                                ),*/
                                //const todayCloseDate = DF.format(new Date(), 'yyyy-MM-dd');

                                const upcome_rides = await db.select("*").from('se_project.rides')
                                    .where('tripdate', '>', tripDate)
                                    .where('tripdate', '<', up_date_bound);
                                //TODO ret4 not finished  .where('published_date', '<', 2000)

                                //  { tripdate >= currentdate}
                                //1-full ticket price, check price
                                //2-route
                                //3-transfer stations,
                                //4-upcoming ride on the date of the ticket


                                //  { tripdate >= currentdate}
                                //1-full ticket price, check price
                                //2-route
                                //3-transfer stations,
                                //4-upcoming ride on the date of the ticket

                                const ret = {ticket_cost, potential_routs_data, transfer_stations, upcome_rides};//and add the pricecheck price ,upcome_rides
                                return res.status(201).json(ret);

                            } else {
                                return res.status(400).send("origin or destination is invalid station");

                            }

                        }//end of if(ticket_cost<=payedAmount)
                        else {
                            return res.status(400).send("not enough for the payment");
                        }
                    }

                }
            } catch (e) {
                console.log("Could not buy online tickets", e.message);
                return res.status(400).send(e.message);
            }
        });

//ok so, the purchasetype is set to cash or subscription rather than 0 or 1 in your code and also any purchase made with a
// subscription should always have an amount of 1
    // -Request refund PUT
//: Undefined binding(s) detected when compiling FIRST. Undefined column(s): [id] query: select * from "se_project"."refund_requests" where "id" = ? limit ?
    app.put("/api/v1/requests/refunds/:requestId", async (req, res) => {
        const requestId = parseInt(req.params.requestId);//Number(ret1[0]["id"]);

        let status = await db("se_project.senior_requests")
            .where({id: requestId})
            .select("status")
            .first();

        if (await db("se_project.senior_requests")
            .where({id: requestId})
            .select("status")
            .first() === 'accepted') {
            return res.status(400).send("Refund request has already been accepted");
        }
        if (await db("se_project.senior_requests")
            .where({id: requestId})
            .select("status")
            .first() === 'rejected') {
            return res.status(400).send("Refund request has already been rejected");
        }

        const existRequest = await db("se_project.refund_requests")
            .where({id: requestId})
            .select("*")
            .first();
        if (isEmpty(existRequest)) {
            return res.status(400).send("Refund request does not exist");
        }

        try {
            //check if the ticket associated with the refund request has a future trip date
            const ticket = await db("se_project.tickets")
                .where({id: existRequest.ticketid})
                .select("*")
                .first();
            if (ticket.tripdate <= new Date()) {
                const updateRefundRequestStatus = await db("se_project.refund_requests")
                    .where("id", requestId)
                    .update({status: "rejected"})
                    .returning("*");
                return res.status(200).json(updateRefundRequestStatus);
                // return res.status(400).send("Only future-dated tickets can be refunded"); //should i also return rejected with it or not
            }

            //   const { status: refundStatus } = req.body;
            //   if (refundStatus !== "accepted" && refundStatus !== "rejected") {
            //     return res.status(400).send("Invalid status value");
            //   }
            //   const stat = await db("se_project.refund_requests")
            //     .where("id", requestId)
            //     .returning("status")

            //   const updateRefundRequestStatus = await db("se_project.refund_requests")
            //     .where("id", requestId)
            //     .update({ status: refundStatus })
            //     .returning("*");
            //   if (stat === "accepted") {
            //     return res.status(400).send("Request has already been accepted");
            //   }
            //   if (stat === "rejected") {
            //     return res.status(400).send("Request has already been accepted");
            //   }

            // Check if the user has a subscription
            const subscription = await db("se_project.subscription")
                .where({userid: existRequest.userid})
                .select("*")
                .first();

            if (!isEmpty(subscription)) {
                //get the number of tickets and insert it into a variable
                const numberoftickets = await db("se_project.subscription")
                    .where({userid: existRequest.userid})
                    .returning("nooftickets");

                //refund with subscription

                //getting remaining values

                const purchasedIid = await db("se_project.transaction")
                    .where({userid: existRequest.userid})
                    .returning("purchasedid");

                await db('se_project.transactions').insert({
                    amount: (numberoftickets + 1),
                    userid: existRequest.userid,
                    purchasedIid: purchasedIid,
                    purchasetype: "subscription"
                })
                    .returning('*');
                const updateRefundRequestStatus = await db("se_project.refund_requests")
                    .where("id", requestId)
                    .update({status: "accepted"})
                    .returning("*");

            } else {
                //refund with online payment
                const purchasedIid = await db("se_project.transaction")
                    .where({userid: existRequest.userid})
                    .returning("purchasedid");

                const refundamount = await db("se_project.transaction")
                    .where({userid: existRequest.userid})
                    .returning("amount");

                await db('se_project.transactions').insert({
                    amount: (-refundamount),
                    userid: existRequest.userid,
                    purchasedid: purchasedIid,
                    purchasetype: "transaction"
                })
                    .returning('*');
                const updateRefundRequestStatus = await db("se_project.refund_requests")
                    .where("id", requestId)
                    .update({status: "accepted"})
                    .returning("*");
            }

            return res.status(200).json(updateRefundRequestStatus);
        } catch (err) {
            console.log("error message", err.message);
            return res.status(400).send("Could not update refund request status");
        }
    });
// -Request Senior PUT

    app.put("/api/v1/requests/senior/:requestId", async (req, res) => {
        const requestId = parseInt(req.params.requestId);//Number(ret1[0]["id"]);

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
        if (isEmpty(existRequest)) {
            return res.status(400).send("Senior request does not exist");
        }
        try {
            // const user = await getUser(req);
            // console.log(user)
            const seniorUser = await db.select('*').from('se_project.senior_requests').where('id', '=', requestId)
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
                    console.log(seniorUser)
                    const updateUserRoleToSenior = await db("se_project.users").where('id', '=', seniorUser[0]['userid']).update({
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


    // -Update zone price PUT

    app.put("/api/v1/zones/:zoneId", async (req, res) => {
        const zoneId = parseInt(req.params.zoneId);//Number(ret1[0]["id"]);
        const jsonData = req.body;
        let price = jsonData["selectedzonePrice"]
        const existZone = await db("se_project.zones")
            .where({id: zoneId})
            .select("*")
            .first();
        if (isEmpty(existZone)) {
            return res.status(400).send("Zone does not exist");
        }

        try {
            const updateZonePrice = await db("se_project.zones")
                .where("id", zoneId)
                .update({
                    price: price
                }).returning("*");
            console.log(updateZonePrice);

            return res.status(200).json(updateZonePrice);

        } catch (err) {
            console.log("error message", err.message);
            return res.status(400).send("Could not update zone price"); //recheck
        }
    })


    app.post("/api/v1/refund/:ticketId", async (req, res) => {
        try {
            const user = await getUser(req);
            if (user.isAdmin) return res.status(401);
            const {ticketId} = req.params;
            const existTicket = await db.select("*").from("se_project.tickets").where("id", ticketId);
            if (existTicket) {
                const existRequest = await db.select("*").from("se_project.refund_requests").where("ticketid", ticketId);
                if (!existRequest) {
                    const ticketPurchase = await db.select("amount").from("se_project.transactions").where("purchasedIid", ticketId);
                    if (ticketPurchase) {
                        refundAmount = ticketPurchase;
                    } else {
                        refundAmount = 0;
                    }
                    const userId = await db.select("userId").from("se_project.tickets").where("id", ticketId);
                    let status = "pending";
                    let newRequest = {
                        status,
                        userId,
                        refundAmount,
                        ticketId,
                    };
                    const addedRequest = await db("se_project.refund_requests").insert(newRequest).returning("*");
                    return res.status(201).json(addedRequest);
                } else {
                    return res.status(409).send("there already exists a refund request for this ticket");
                }
            } else {
                return res.status(400).send("there isnt a ticket with such ticket ID");
            }
        } catch (err) {
            console.log("error message ", err.message);
            return res.status(400).send(err.message);
        }
    });

    app.post("/api/v1/senior/request", async (req, res) => {
        try {
            const user = await getUser(req);
            if (user.isAdmin) return res.status(401);
            if (user.isSenior) return res.status(401).send("You are already a senior :)");
            const userid = user["userid"];
            const existReq = await db.select("*").from("se_project.senior_requests").where("userid", userid).first();
            console.log(existReq)
            if (existReq) {
                return res.status(409).send("Request already submitted");
            } else {
                const {nationalid} = req.body;
                let status = "pending";
                let newSRequest = {
                    status,
                    userid,
                    nationalid,
                };
                const addedSRequest = await db("se_project.senior_requests").insert(newSRequest).returning("*");
                return res.status(201).json(addedSRequest)
            }
        } catch (err) {
            console.log("error message ", err.message);
            return res.status(400).send(err.message);
        }


    })
    app.post("/api/v1/station", async (req, res) => {
        try {
            const user = await getUser(req);
            if (!user.isAdmin) return res.status(401);
            const {stationname} = req.body;
            console.log(stationname);
            const existstation = await db("se_project.stations")
                .where({stationname: stationname})
                .select("*")
                .first();
            if (existstation) {
                console.log("station already exists")
                return res.status(409).send("there already exists a station with that name");
            } else {
                let stationtype = 'normal';
                let stationposition = null
                let stationstatus = 'new';
                let newStation = {
                    stationname,
                    stationtype,
                    stationposition,
                    stationstatus,
                };
                const addedStation = await db("se_project.stations").insert(newStation).returning("*");
                return res.status(201).json(addedStation);
            }
        } catch (err) {
            console.log("error message ", err.message);
            return res.status(400).send(err.message);
        }
    })
    app.put("/api/v1/station/:stationId", async (req, res) => {
        try {
            const user = await getUser(req);
            if (!user.isAdmin) return res.status(401);
            const {stationId} = req.params;
            const stationid = parseInt(stationId);
            const {stationname} = req.body;
            const existstation = await db("se_project.stations")
                .where({id: stationid})
                .select("*")
                .first();
            if (existstation) {
                const updatedStation = await db("se_project.stations")
                    .where("id", stationid)
                    .update({stationname: stationname})
                    .returning("*");
                return res.status(200).json(updatedStation);
            } else {
                return res.status(404).send("no station exists with such ID");
            }
        } catch (err) {
            console.log("error message ", err.message);
            return res.status(400).send(err.message);
        }
    })


    app.delete("/api/v1/station/:stationId", async (req, res) => {
        try {
            const user = await getUser(req);
            if (!user.isAdmin) return res.status(401);
            const {stationId} = req.params;
            const stationid2 = parseInt(stationId);

            const existstation = await db("se_project.stations")
                .where({id: stationid2})
                .select("*")
                .first();
            if (!existstation) {
                return res.status(404).send("no station exists with such ID");
            } else {
                //const stationT = await db.select("*").from("se_project.stations").where( "id", stationid2) ;
                if (existstation.stationtype === "transfer") {
                    const newTransfer = await db.select("*").from("se_project.routes").where("tostationid", stationid2).first();
                    let stationtype = "transfer";
                    console.log("test0");
                    const NormToTrans = await db("se_project.stations").where("id", newTransfer.fromstationid).update({stationtype: stationtype}).returning("*");
                    const fromStationid = NormToTrans.id;
                    let tostationid = NormToTrans.id;
                    let stationid = NormToTrans.id;
                    console.log("test1");
                    const updatingTransfer = await db("se_project.routes")
                        .where("fromstationid", stationid2)
                        .update({fromstationid: newTransfer.fromstationid})
                        .returning("*");
                    const updatingTransfer2 = await db("se_project.routes")
                        .where("tostationid", stationid2)
                        .update({tostationid: newTransfer.fromstationid})
                        .returning("*");
                    console.log("test2");
                    const deleteDupeRoute = await db("se_project.routes")
                        .where("fromstationid", newTransfer.fromstationid)
                        .andWhere("tostationid", newTransfer.fromstationid)
                        .del()
                        .returning("*");
                    const updateRS = await db("se_project.stationroutes")
                        .where("stationid", stationid2)
                        .update({stationid: newTransfer.id})
                        .returning("*");
                    const deletedStation = await db("se_project.stations")
                        .where("id", stationid2)
                        .del()
                        .returning("*");
                    return res.status(200).json(deletedStation);
                } else {
                    console.log(stationid2);
                    //const stationP = await db.select("*").from("se_project.stations").where( "id", stationid2) ;
                    if (existstation.stationposition === "start") {
                        console.log("test");
                        const newStart = await db("se_project.routes")
                            .where({fromstationid: stationid2})
                            .select("*")
                            .first();
                        console.log(newStart.tostationid);
                        let stationposition = "start";
                        console.log(stationposition);
                        const updatedStart = await db("se_project.stations")
                            .where("id", newStart.tostationid)
                            .update({stationposition: stationposition})
                            .returning("*");
                        const deleteRS = await db("se_project.stationroutes")
                            .where("stationid", stationid2)
                            .del()
                            .returning("*");
                        const deletedStation = await db("se_project.stations")
                            .where("id", stationid2)
                            .del()
                            .returning("*");
                        return res.status(200).json(deletedStation);
                    } else if (existstation.stationposition === "end") {
                        const newEnd = await db("se_project.routes")
                            .where({tostationid: stationid2})
                            .select("*")
                            .first();
                        let stationposition = "end";
                        const updatedEnd = await db("se_project.stations")
                            .where("id", newEnd.fromstationid)
                            .update({stationposition: stationposition})
                            .returning("*");
                        //const unwantedRoute = await db.select("*").from("se_project.routes").where( "fromstationid", stationid2).orWhere("tostationid" , stationid2) ;
                        const deleteRS = await db("se_project.stationroutes")
                            .where("stationid", stationid2)
                            .del()
                            .returning("*");
                        const deletedStation = await db("se_project.stations")
                            .where("id", stationid2)
                            .del()
                            .returning("*");
                        return res.status(200).json(deletedStation);
                    } else {
                        //const newRS = await db.select("tostationid").from("se_project.routes").where( "fromstationid" , existstation.id) ;
                        const newRS = await db.select("*").from("se_project.routes").where("tostationid", stationid2);
                        let fromstationid = newRS[0].fromstationid;
                        let tostationid = newRS[1].fromstationid;
                        let routename = "new";
                        console.log(fromstationid);
                        console.log(tostationid);
                        let newRoute1 = {
                            routename,
                            fromstationid,
                            tostationid,
                        };
                        fromstationid = newRS[1].fromstationid;
                        tostationid = newRS[0].fromstationid;
                        console.log(fromstationid);
                        console.log(tostationid);
                        let newRoute2 = {
                            routename,
                            fromstationid,
                            tostationid,
                        };
                        const addedRoute1 = await db("se_project.routes").insert(newRoute1).returning("*");
                        const addedRoute2 = await db("se_project.routes").insert(newRoute2).returning("*");
                        console.log(addedRoute1);
                        console.log(addedRoute2);
                        let routeid = addedRoute1[0].id;
                        let stationid = tostationid;
                        console.log(tostationid);
                        console.log(stationid);
                        let newRstation = {
                            stationid,
                            routeid,
                        };
                        console.log(newRstation);
                        routeid = addedRoute2[0].id;
                        let newRstation2 = {
                            stationid,
                            routeid,
                        };
                        console.log(newRstation2);
                        routeid = addedRoute1[0].id;
                        stationid = fromstationid;
                        let newRstation3 = {
                            stationid,
                            routeid,
                        };
                        console.log(newRstation3);
                        routeid = addedRoute2[0].id;
                        let newRstation4 = {
                            stationid,
                            routeid,
                        };
                        console.log(newRstation4);
                        const addedRS = await db("se_project.stationroutes").insert(newRstation).returning("*");
                        const addedRS2 = await db("se_project.stationroutes").insert(newRstation2).returning("*");
                        const addedRS3 = await db("se_project.stationroutes").insert(newRstation3).returning("*");
                        const addedRS4 = await db("se_project.stationroutes").insert(newRstation4).returning("*");
                        const deletedStation = await db("se_project.stations")
                            .where("id", stationid2)
                            .del()
                            .returning("*");
                        return res.status(200).json(deletedStation);
                    }
                }
            }
        } catch (err) {
            console.log("error message ", err.message);
            return res.status(400).send(err.message);
        }
    })

    app.post("/api/v1/route", async (req, res) => {
        // need to add some defensibe programming
        // need to check whethter the user is an admin or not
        const user = await getUser(req);
        if (!user.isAdmin) return res.status(401);

        const {routename, fromstationid, tostationid} = req.body;

        if (!routename) return res.status(422).send("Missing route name.");

        if (!fromstationid) return res.status(422).send("Missing from station ID.");

        if (!tostationid) return res.status(422).send("Missing to station ID.");

        // try to see if the route already exists
        const existRoute = await db("se_project.routes")
            .where({routename: routename})
            .select("*")
            .first();
        if (existRoute) {
            return res.status(409).send("Route already exists");
        }

        try {
            const newRoute = {
                routename,
                fromstationid,
                tostationid,
            };

            const addedRoute = await db
                .insert(newRoute)
                .into("se_project.routes")
                .returning("*");

            const getRouteID = await db("se_project.routes")
                .where({
                    routename: newRoute.routename,
                    fromstationid: newRoute.fromstationid,
                    tostationid: newRoute.tostationid,
                })
                .select("id")
                .first();

            const SR1 = {
                routeid: getRouteID.id,
                stationid: newRoute.fromstationid,
            };

            const SR2 = {
                routeid: getRouteID.id,
                stationid: newRoute.tostationid,
            };

            const addedSR1 = await db
                .insert(SR1)
                .into("se_project.stationroutes")
                .returning("*");

            const addedSR2 = await db
                .insert(SR2)
                .into("se_project.stationroutes")
                .returning("*");

            return res.status(200).send("Added route");
        } catch (err) {
            return res.status(400).send("Could not create route");
        }
    });

    // -Update route:  DONE
    app.put("/api/v1/route/:routeid", async (req, res) => {
        // need to check whethter the user is an admin or not
        const user = await getUser(req);
        if (!user.isAdmin) return res.status(401);

        const {routename} = req.body;

        if (!routename) return res.status(422).send("Missing route name.");

        const {routeid} = req.params;
        const routeId = parseInt(routeid);

        // try to see if the route already exists
        const existRoute = await db("se_project.routes")
            .where({id: routeId})
            .select("*")
            .first();
        if (!existRoute) {
            return res.status(404).send("Route does not exist");
        }
        try {
            const updateRoute = await db("se_project.routes")
                .where("id", routeid)
                .update({
                    routename: routename,
                })
                .returning("*");

            return res.status(200).json(updateRoute).send("Updated route");
        } catch (err) {
            console.log("eror message", err.message);
            return res.status(400).send("Could not update route");
        }
    });

    // -Delete route: DONE
    app.delete("/api/v1/route/:routeid", async (req, res) => {
        //still need to adjust for the missing cases as to contradict my old logic

        // need to check whethter the user is an admin or not
        const user = await getUser(req);
        if (!user.isAdmin) return res.status(401);

        const {routeid} = req.params;

        const routeId = parseInt(routeid);

        // try to see if the route already exists
        const existRoute = await db("se_project.routes")
            .where({id: routeId})
            .select("*")
            .first();
        if (!existRoute) {
            return res.status(404).send("Route does not exist");
        }

        const fromST = await db("se_project.routes")
            .where({id: routeId})
            .select("fromstationid")
            .first();
        const fromSTid = fromST.fromstationid;
        const toST = await db("se_project.routes")
            .where({id: routeId})
            .select("tostationid")
            .first();
        const toSTid = toST.tostationid;

        const fstation = await db("se_project.stations")
            .where({id: fromSTid})
            .select("stationposition")
            .first();
        const fstationpos = fstation.stationposition;

        const tstation = await db("se_project.stations")
            .where({id: toSTid})
            .select("stationposition")
            .first();
        const tstationpos = tstation.stationposition;

        //case for the start
        if (fstationpos === "start" || tstationpos === "start") {
            if (fstation === "start") {
                const othRoute = await db("se_project.routes")
                    .where({id: routeId, tostationid: fromSTid})
                    .select("*")
                    .first();

                if (!othRoute) {
                    try {
                        await db("se_project.stations")
                            .where({id: fromSTid})
                            .update({stationstatus: "inactive"})
                            .returning("*");
                        //change the position of the connected station
                        await db("se_project.stations")
                            .where({id: toSTid})
                            .update({stationposition: fstationpos})
                            .returning("*");
                    } catch (error) {
                        return res.status(500).send(error);
                    }
                }
            }
            if (tstation === "start") {
                const othRoute = await db("se_project.routes")
                    .where({id: routeId, fromstationid: toSTid})
                    .select("*")
                    .first();

                if (!othRoute) {
                    try {
                        await db("se_project.stations")
                            .where({id: toST})
                            .update({stationstatus: "inactive"})
                            .returning("*");
                        //change the position of the connected station
                        await db("se_project.stations")
                            .where({id: fromSTid})
                            .update({stationposition: fstationpos})
                            .returning("*");
                    } catch (error) {
                        return res.status(500).send(error);
                    }
                }
            }
        }
        //case for the end
        if (tstationpos === "end" || fstationpos === "end") {
            if (tstationpos === "end") {
                const othRoute = db("se_project.routes")
                    .where({id: routeId, fromstationid: toSTid})
                    .select("*")
                    .first();

                if (!othRoute) {
                    db("se_project.stations")
                        .where({id: toSTid})
                        .update({stationstatus: "inactive"})
                        .returning("*");
                    //change the position of the connected station
                    db("se_project.stations")
                        .where({id: fromSTid})
                        .update({stationposition: tstationpos})
                        .returning("*");
                }
            }
            if (fstationpos === "end") {
                const othRoute = db("se_project.routes")
                    .where({id: routeId, tostationid: fromSTid})
                    .select("*")
                    .first();

                if (!othRoute) {
                    db("se_project.stations")
                        .where({id: fromSTid})
                        .update({stationstatus: "inactive"})
                        .returning("*");
                    //change the position of the connected station
                    db("se_project.stations")
                        .where({id: toSTid})
                        .update({stationposition: fstationpos})
                        .returning("*");
                }
            }
        }

        if (
            fstationpos === "start" ||
            tstationpos === "start" ||
            tstationpos === "end" ||
            fstationpos === "end"
        ) {
            try {
                const deleteRoute = await db("se_project.routes")
                    .where({id: routeId})
                    .del()
                    .returning("*");
                return res.status(200).json(deleteRoute);
            } catch (err) {
                console.log("eror message", err.message);
                return res.status(400).send("Can not delete route");
            }
        } else return res.status(400).send("Can not delete route");
    });


    // Check Price-----------------------------------------------------------------------------------------
    async function floydWarshall(adjMatrix) {
        const n = adjMatrix.length;
        const dist = [...adjMatrix];

        for (let k = 0; k < n; k++) {
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    if (
                        dist[i][k] !== Infinity &&
                        dist[k][j] !== Infinity &&
                        dist[i][k] + dist[k][j] < dist[i][j]
                    ) {
                        dist[i][j] = dist[i][k] + dist[k][j];
                    }
                }
            }
        }
        return dist;
    }

    //VIP
    async function create2dmatrix() {
        const stCount = await db("se_project.stations").count();
        let stCountint = parseInt(stCount[0]["count"]);
        let matrix = [];
        // console.log("lol");

        for (let i = 0; i < stCountint; i++) {
            // console.log("i:",i);
            matrix[i] = [];
            const existST1 = await db("se_project.stations")
                .where({id: i + 1})
                .select("*")
                .first();
            if (isEmpty(existST1)) {
                stCountint++;
                // continue;
            }
            for (let j = 0; j < stCountint; j++) {
                // console.log("stcount:",stCountint);
                // console.log("j:",j);
                const existRoute = await db("se_project.routes")
                    .where({fromstationid: i + 1, tostationid: j + 1})
                    .select("*")
                    .first();

                const existST2 = await db("se_project.stations")
                    .where({id: j + 1})
                    .select("*")
                    .first();

                if (isEmpty(existST2)) stCountint++;
                else if (!isEmpty(existRoute)) matrix[i][j] = 1;
                else if (i === j) matrix[i][j] = 0;
                else matrix[i][j] = Infinity;
            }
        }
        // console.log(matrix);
        return matrix;
    }

    // Check Price:
    app.get(
        "/api/v1/tickets/price/:originId/:destinationId",
        async (req, res) => {
            // < 9 stations = 5 gneh,
            // 10 - 16 stations = 7 gneh
            // > 16 stations = 10 gneh
            // 50% discount law senior
            try {
                const user = await getUser(req);
                const {originId, destinationId} = req.params;
                const originid = parseInt(originId);
                const destinationid = parseInt(destinationId);
                let startStation = await db
                    .select("*")
                    .from("se_project.stations")
                    .where("id", "=", originid)
                    .first();
                let endStation = await db
                    .select("*")
                    .from("se_project.stations")
                    .where("id", "=", destinationid)
                    .first();
                let matrix = await create2dmatrix();
                let distMatrix = await floydWarshall(matrix);
                const distance = distMatrix[originid][destinationid];
                let price;
                switch (true) {
                    case distance <= 9:
                        price = 5;
                        break;
                    case distance > 9 && distance <= 16:
                        price = 7;
                        break;
                    default:
                        price = 10;
                }
                if (user.isSenior) {
                    price = price * 0.5;
                }

                // console.log(shortestPath);

                return res.status(200).json(price);
            } catch (err) {
                console.log(err.message);
                return res.status(400).send(err.message);
            }
        }
    );

};

