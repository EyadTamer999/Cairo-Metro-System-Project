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
//   app.post("/api/v1/tickets/purchase/subscription", async (req, res) => {
//     try {
//       const  { subId, origin, destination, tripDate } = req.body;
//       console.log(req.body);
//       // Retrieve full ticket price, route and transfer stations based on origin and destination
//       const ticketDetails = await getTicketDetails(origin, destination);
//       let newPaymentBySubscription = {
//         subId,
//         origin,
//         destination,
//         tripDate
//       };
//       const paidBySubscription = await db.insert(newPaymentBySubscription).into("se_project.tickets").returning("*"); 
//       const upcomingRide = await db.insert(newPaymentBySubscription).into("se_project.rides").returning("*"); //should i insert to both or just one?

//       console.log(paidBySubscription);
//       return res.status(201).json(paidBySubscription);
//   } catch (err) {
//       console.log("Error paying for ticket by subscription", err.message);
//       return res.status(400).send(err.message);


//   }
//   });

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
                //store query parameters
                // console.log(newPaymentBySubscription);

                const paidBySubscription = await db.insert(newPaymentBySubscription).into("se_project.tickets");

                let newNumOfTickets = userSubscription[0]['nooftickets'] - 1

                let updateTickets = await db("se_project.subscription").where('userid', '=', userid).update({
                    nooftickets: newNumOfTickets
                })

                //reference remix
                //insert in ticket table
                ret1=await db('se_project.tickets').insert({
                    origin:origin,
                    destination:destination,
                    subid:subid,
                    userid:uid,
                    tripdate:tripdate
          
          
                  }).returning("*");
                  //
                  ret2=await db('se_project.rides').insert({
                    status:'upcoming',
                    origin:origin,
                    destination:destination,
                    userid:userid,
                    ticketid:ret1[0].id,
                    tripdate: tripdate
                    
          
                  }).returning("*");
                  
                  
                  
                  ret={origin,destination,uid,tripDate,payedAmount,purchasedId,holderName,creditCardNumber};
                //   return res.status(201).json(ret);







                console.log(newNumOfTickets)

                return res.status(201).json(updateTickets);

                //send new data
                //full ticket price
                //routes
                //transfer stations

            }
        } catch (err) {
            console.log("Error paying for ticket by subscription", err.message);
            return res.status(400).send(err.message);
        }
        



 })

};
