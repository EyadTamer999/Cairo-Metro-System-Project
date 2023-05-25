const {isEmpty} = require("lodash");
const {v4} = require("uuid");
const db = require("../../connectors/db");
const roles = require("../../constants/roles");
const {getSessionToken} = require('../../utils/session')
const getUser = async function (req) {
    const sessionToken = getSessionToken(req);
    if (!sessionToken) {
        return res.status(301).redirect("/");
    }
    console.log("hi", sessionToken);
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
     // const {userId}=req.body
     console.log("hiiiiiiiiiii");
      const users = await db.select('*').from("se_project.users")
        
      return res.status(200).json(users);
    } catch (e) {
      console.log(e.message);
      return res.status(400).send("Could not get users");
    }
  });

  


// Pay for ticket by subscription
  app.post("/api/v1/tickets/purchase/subscription", async (req, res) => {
    try {
      const  { subId, origin, destination, tripDate } = req.body;
      console.log(req.body);
      // Retrieve full ticket price, route and transfer stations based on origin and destination
      const ticketDetails = await getTicketDetails(origin, destination);
      let newPaymentBySubscription = {
        subId,
        origin,
        destination,
        tripDate
      };
      const paidBySubscription = await db.insert(newPaymentBySubscription).into("se_project.tickets").returning("*"); 
      const upcomingRide = await db.insert(newPaymentBySubscription).into("se_project.rides").returning("*"); //should i insert to both or just one?

      console.log(paidBySubscription);
      return res.status(201).json(paidBySubscription);
  } catch (err) {
      console.log("Error paying for ticket by subscription", err.message);
      return res.status(400).send(err.message);


  }
  });

  // async function getTicketDetails(origin, destination) {
  //   //retrieve full ticket price, route and transfer stations based on origin and destination
  //   // ...
  //   return {
  //     price: ...,
  //     route: ...,
  //     transferStations: ...
  //   };


// Check Price:
// Users can check the price of the ticket by specifying the origin and destination.
// So, you have to figure a way through the three tables(stations, routes, stationRoutes)
// Hint visited stations array

  app.post("/api/v1/tickets/price/:originId & :destinationId", async (req, res) => { 
    try {
      const {} =
        req.body;
      console.log(req.body);
      let newPrice = {
      };
    
      const checkedPrice = await db.insert(newPrice).into("").returning("*"); //insert where??
      console.log(checkedPrice);
      return res.status(201).json(checkedPrice);
  } catch (err) {
      console.log("Error checking price", err.message);
      return res.status(400).send(err.message);

  }
  });

// Simulate Ride
app.put("/api/v1/ride/simulate", async (req, res) => {
  try{
    const {origin, destination, tripDate} = req.body;
    // const { origin, destination } = req.params;
    const simulateRide = await db("se_project")
    .where("rides.destination", destination)
    .where("rides.origin", origin)
    .where("rides.tripDate", tripDate)
    .update({
      origin:string,
      destination:string,
      tripDate:dateTime
    })
    .returning("*");
    return res.status(200).json(updateRoute);
  }
  catch(err){
    console.log("Error simulating ride", err.message);
    return res.status(400).send(err.message);
  }
})


};
