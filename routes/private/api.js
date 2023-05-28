const { isEmpty, get } = require("lodash");
const { v4 } = require("uuid");
const db = require("../../connectors/db");
const roles = require("../../constants/roles");
const { getSessionToken } = require("../../utils/session");
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
  console.log("user =>", user);
  return user;
};

module.exports = function (app) {
  // example
  app.put("/users", async function (req, res) {
    try {
      const user = await getUser(req);
      const users = await db.select("*").from("se_project.users");

      return res.status(200).json(users);
    } catch (e) {
      console.log(e.message);
      return res.status(400).send("Could not get users");
    }
  });

  // -Request refund PUT 
  app.put("/api/v1/requests/refunds/:requestId", async (req, res) => {
    const { requestId } = req.params;
    const existRequest = await db("se_project.refund_requests")
      .where({ id: requestId })
      .select("*")
      .first();
    if (!existRequest) {
      return res.status(400).send("Refund request does not exist");
    }

    try {
      //check if the ticket associated with the refund request has a future trip date
      const ticket = await db("se_project.tickets")
        .where({ id: existRequest.ticketid })
        .select("*")
        .first();
      if (ticket.tripdate <= new Date()) {
        return res.status(400).send("Only future-dated tickets can be refunded"); //should i also return rejected with it or not
      }

      const { status: refundStatus } = req.body;
      if (refundStatus !== "accepted" && refundStatus !== "rejected") {
        return res.status(400).send("Invalid status value");
      }
      const stat = await db("se_project.refund_requests")
        .where("id", requestId)
        .returning("status")

      const updateRefundRequestStatus = await db("se_project.refund_requests")
        .where("id", requestId)
        .update({ status: refundStatus })
        .returning("*");
      if (stat === "accepted") {
        return res.status(400).send("Request has already been accepted");
      }
      if (stat === "rejected") {
        return res.status(400).send("Request has already been accepted");
      }

      // Check if the user has a subscription
      const subscription = await db("se_project.subscription")
        .where({ userid: existRequest.userid })
        .select("*")
        .first();

      if (subscription) {
        //get the number of tickets and insert it into a variable 
        const numberoftickets = await db("se_project.subscription")
          .where({ userid: existRequest.userid })
          .returning("nooftickets");

        //refund with subscription

        //getting remaining values
        const refundamount = await db("se_project.transaction")
          .where({ userid: existRequest.userid })
          .returning("amount");

        const purchasedIid = await db("se_project.transaction")
          .where({ userid: existRequest.userid })
          .returning("purchaseIid");

        await db('se_project.transactions').insert({
          amount: (numberoftickets + 1),
          userid: existRequest.userid,
          purchasedIid: purchasedIid,
          purchasetype: "subscription"
        })
          .returning('*');
          
        } else {
        //refund with online payment

        await db('se_project.transactions').insert({
          amount: (-refundamount),
          userid: existRequest.userid,
          purchasedIid: purchasedIid,
          purchasetype: "transaction"
        })
          .returning('*');

      }

      return res.status(200).json(updateRefundRequestStatus);
    } catch (err) {
      console.log("error message", err.message);
      return res.status(400).send("Could not update refund request status");
    }
  });

  // -Request Senior PUT
  app.put("/api/v1/requests/senior/:requestId", async (req, res) => {
    const { requestId } = req.params;
    const existRequest = await db("se_project.senior_requests")
      .where({ id: requestId })
      .select("*")
      .first();
    if (!existRequest) {
      return res.status(400).send("Senior request does not exist");
    }
    try {
      const { status } = req.body;
      if (status !== "accepted" && status !== "rejected") {
        return res.status(400).send("Invalid status value");
      }
      const updateSeniorRequestStatus = await db("se_project.senior_requests")
        .where("id", requestId)
        .update({ status: status })
        .returning("*");
      return res.status(200).json(updateSeniorRequestStatus);
    } catch (err) {
      console.log("error message", err.message);
      return res.status(400).send("Could not update senior request");
    }
  });

  // -Update zone price PUT
  app.put("/api/v1/zones/:zoneId", async (req, res) => {
    const { zoneId } = req.params;
    const existZone = await db("se_project.zones")
      .where({ id: zoneId })
      .select("*")
      .first();
    if (!existZone) {
      return res.status(400).send("Zone does not exist");
    }

    try {
      const { price } = req.body;
      const updateZonePrice = await db("se_project.zones")
        .where("id", zoneId)
        .update({
          price: price,
        })
        .returning("*");
      return res.status(200).json(updateZonePrice);
    } catch (err) {
      console.log("error message", err.message);
      return res.status(400).send("Could not update zone price"); //recheck
    }
  });

  /*
    Create api endpoints for admin :
    - Create routes
    - Update routes
    - Delete routes
  */

  // - Create routes:  DONE
  app.post("/api/v1/route", async (req, res) => {
    // need to add some defensibe programming
    // need to check whethter the user is an admin or not
    const user = await getUser(req);
    if (!user.isAdmin) return res.status(401);

    const { routename, fromstationid, tostationid } = req.body;

    if (!routename) return res.status(422).send("Missing route name.");

    if (!fromstationid) return res.status(422).send("Missing from station ID.");

    if (!tostationid) return res.status(422).send("Missing to station ID.");

    // try to see if the route already exists
    const existRoute = await db("se_project.routes")
      .where({ routename: routename })
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

    const { routename } = req.body;

    if (!routename) return res.status(422).send("Missing route name.");

    const { routeid } = req.params;
    const routeId = parseInt(routeid);

    // try to see if the route already exists
    const existRoute = await db("se_project.routes")
      .where({ id: routeId })
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

    const { routeid } = req.params;

    const routeId = parseInt(routeid);

    // try to see if the route already exists
    const existRoute = await db("se_project.routes")
      .where({ id: routeId })
      .select("*")
      .first();
    if (!existRoute) {
      return res.status(404).send("Route does not exist");
    }

    const fromST = await db("se_project.routes")
      .where({ id: routeId })
      .select("fromstationid")
      .first();
    const fromSTid = fromST.fromstationid;
    const toST = await db("se_project.routes")
      .where({ id: routeId })
      .select("tostationid")
      .first();
    const toSTid = toST.tostationid;

    const fstation = await db("se_project.stations")
      .where({ id: fromSTid })
      .select("stationposition")
      .first();
    const fstationpos = fstation.stationposition;

    const tstation = await db("se_project.stations")
      .where({ id: toSTid })
      .select("stationposition")
      .first();
    const tstationpos = tstation.stationposition;

    //case for the start
    if (fstationpos === "start" || tstationpos === "start") {
      if (fstation === "start") {
        const othRoute = await db("se_project.routes")
          .where({ id: routeId, tostationid: fromSTid })
          .select("*")
          .first();

        if (!othRoute) {
          try {
            await db("se_project.stations")
              .where({ id: fromSTid })
              .update({ stationstatus: "inactive" })
              .returning("*");
            //change the position of the connected station
            await db("se_project.stations")
              .where({ id: toSTid })
              .update({ stationposition: fstationpos })
              .returning("*");
          } catch (error) {
            return res.status(500).send(error);
          }
        }
      }
      if (tstation === "start") {
        const othRoute = await db("se_project.routes")
          .where({ id: routeId, fromstationid: toSTid })
          .select("*")
          .first();

        if (!othRoute) {
          try {
            await db("se_project.stations")
              .where({ id: toST })
              .update({ stationstatus: "inactive" })
              .returning("*");
            //change the position of the connected station
            await db("se_project.stations")
              .where({ id: fromSTid })
              .update({ stationposition: fstationpos })
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
          .where({ id: routeId, fromstationid: toSTid })
          .select("*")
          .first();

        if (!othRoute) {
          db("se_project.stations")
            .where({ id: toSTid })
            .update({ stationstatus: "inactive" })
            .returning("*");
          //change the position of the connected station
          db("se_project.stations")
            .where({ id: fromSTid })
            .update({ stationposition: tstationpos })
            .returning("*");
        }
      }
      if (fstationpos === "end") {
        const othRoute = db("se_project.routes")
          .where({ id: routeId, tostationid: fromSTid })
          .select("*")
          .first();

        if (!othRoute) {
          db("se_project.stations")
            .where({ id: fromSTid })
            .update({ stationstatus: "inactive" })
            .returning("*");
          //change the position of the connected station
          db("se_project.stations")
            .where({ id: toSTid })
            .update({ stationposition: fstationpos })
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
          .where({ id: routeId })
          .del()
          .returning("*");
        return res.status(200).json(deleteRoute);
      } catch (err) {
        console.log("eror message", err.message);
        return res.status(400).send("Can not delete route");
      }
    } else return res.status(400).send("Can not delete route");
  });
};
