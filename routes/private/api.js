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
    console.log(sessionToken)
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

    console.log("user =>", user);
    user.isNormal = user.roleid === roles.user;
    user.isAdmin = user.roleid === roles.admin;
    user.isSenior = user.roleid === roles.senior;
    console.log("user =>", user)
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
    app.get("/api/v1/tickets/purchase/subscription", async (req, res) => {
        try {
            const user = await getUser(req);
            // console.log(user)
            let userId = user["userid"]
            // console.log(userId)
            const userHasSub = await db.select('*').from('se_project.subscription').where("userid", '=', userId) //get row
            console.log(isEmpty(userHasSub)) //empty therefore no subscription
            if (isEmpty(userHasSub)) {
                console.log("No subscription.")
                return res.status(404).send("No subscription, choose another payment")
            } else {
                //     const {subId, origin, destination, tripDate} = req.body;
                //     console.log(req.body);
                //     let newPaymentBySubscription = {
                //         subId,
                //         origin,
                //         destination,
                //         tripDate
                //     };
                //     const paidBySubscription = await db.insert(newPaymentBySubscription).into("se_project.tickets").returning("*");
                //     console.log(paidBySubscription);
                //     return res.status(201).json(paidBySubscription);
            }
        } catch (err) {
            console.log("Error paying for ticket by subscription", err.message);
            return res.status(400).send(err.message);
        }
    });
};
