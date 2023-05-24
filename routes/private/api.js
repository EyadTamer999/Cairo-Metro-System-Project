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
            return res.status(200).json(users);
        } catch (e) {
            console.log(e.message);
            return res.status(400).send("Could not get users");
        }
    });


    // Pay for ticket by subscription
    //look through el subscription using el user id
    //check if user has sub, if no sub then no pay.
    //if sub then make ticket! 💪🏽
    app.put("/api/v1/tickets/purchase/subscription", async (req, res) => {
        try {
            //check on user if there exists a subscription under his/her user id
            const user = await getUser(req);

            const userSubscription = await db.select('*').from('se_project.subscription').where("userid", '=', user["userid"]) //get row
            console.log(userSubscription)
            console.log(isEmpty(userSubscription)) //tru = empty therefore no subscription, false = not empty
            if (isEmpty(userSubscription)) {
                console.log("No subscription.")
                return res.status(400).send(userSubscription)
            } else {
                // get the sub id from the user session and getUser
                // get origin and dest and data from user input
                const subId = json(userSubscription['id'])
                console.log(subId)
                const {origin, destination, tripDate} = req.body;
                console.log(req.body);
                let newPaymentBySubscription = {
                    subId,
                    origin,
                    destination,
                    tripDate
                };
                const paidBySubscription = await db.insert(newPaymentBySubscription).into("se_project.tickets").returning("*");
                let numOfTickets = db.select('nooftickets').from('se_project.tickets').where('userid', user['userid'])['nooftickets']
                console.log(paidBySubscription);
                console.log(numOfTickets)
                db("se_project.subscription").where('userid', user['userid']).update({
                    nooftickets: numOfTickets--
                })
                return res.status(201).json(paidBySubscription);
            }
        } catch (err) {
            console.log("Error paying for ticket by subscription", err.message);
            return res.status(400).send(err.message);
        }
    });
};
