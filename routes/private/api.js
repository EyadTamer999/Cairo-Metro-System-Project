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

  /*
    Create api endpoints for admin :
    - Create routes
    - Update routes
    - Delete routes
  */

  // - Create routes:  DONE 
  app.post("/api/v1/route", async (req, res) => {
    // need to check whethter the user is an admin or not
    const user = await getUser(req);
    if (!user.isAdmin) return res.status(401);

    const { routename, fromstationid, tostationid } = req.body;

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

        console.log(addedRoute);

      const getRouteID = await db("se_project.routes")
        .where({
          routename: newRoute.routename,
          fromstationid: newRoute.fromstationid,
          tostationid: newRoute.tostationid,
        })
        .select("id")
        .first();
        console.log(getRouteID);
      const SR1 = {
        routeid: getRouteID.id,
        stationid: newRoute.fromstationid,
      };
      console.log(SR1);

      const SR2 = {
        routeid: getRouteID.id,
        stationid: newRoute.tostationid,
      };

      console.log(SR2);

      const addedSR1 = await db
        .insert(SR1)
        .into("se_project.stationroutes")
        .returning("*");
        console.log(addedSR1);


      const addedSR2 = await db
        .insert(SR2)
        .into("se_project.stationroutes")
        .returning("*");
        console.log(addedSR2);

      return res
        .status(200)
        .send("Added route");
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
    const { routeid } = req.params;
    console.log(routename);
    console.log(typeof routename);
    console.log(routeid);
    console.log(typeof routeid);
    // const routeid2 = routeid.slice(1);
    // console.log(routeid2);
    // console.log(typeof routeid2);
    const routeId = parseInt(routeid);
    console.log(routeId);
    console.log(typeof routeId);
    
    // try to see if the route already exists
    const existRoute = await db("se_project.routes")
    .where({id : routeId})
    .select("*")
    .first();
    if (!existRoute) {
      return res.status(404).send("Route does not exist");
    }
    console.log(existRoute);

    try {
      const updateRoute = await db("se_project.routes")
        .where("id", routeid)
        .update({
          routename: routename,
        })
        .returning("*");
        console.log(updateRoute);
      return res.status(200).send("Updated route");
    } catch (err) {
      console.log("eror message", err.message);
      return res.status(400).send("Could not update route");
    }
  });

  // -Delete route: NOT DONE {Testing}
  app.delete("/api/v1/route/:routeId", async (req, res) => {

    // need to check whethter the user is an admin or not
    const user = await getUser(req);
    if (!user.isAdmin) return res.status(401);

    // try to see if the route already exists
    const existRoute = await db("se_project.routes")
      .where({ id: routeId })
      .select("*")
      .first();
    if (!existRoute) {
      return res.status(404).send("Route does not exist");
    }

    const { routeId } = req.params;

    const fromST = await db("se_project.routes")
      .where({ id: routeId })
      .select("fromStationid")
      .first();
    const toST = await db("se_project.routes")
      .where({ id: routeId })
      .select("toStationid")
      .first();

    const fstation = await db("se_project.stations")
      .where({ id: fromST })
      .select("stationposition")
      .first();
    const tstation = await db("se_project.stations")
      .where({ id: toST })
      .select("stationposition")
      .first();

    //case for the start
    if (fstation === "start") {
      const othRoute = await db("se_project.routes")
        .where({ id: routeId, toStationid: fromST })
        .select("*")
        .first();

      if (!othRoute) {
        try {
          await db("se_project.stations")
            .where({ id: fromST })
            .update({ stationstatus: "inactive" })
            .returning("*");
          //change the position of the connected station
          await db("se_project.stations")
            .where({ id: toST })
            .update({ stationposition: fstation })
            .returning("*");
        } catch (error) {
          return res.status(500).send(error);
        }
      }
    }
    //case for the end
    if (tstation === "end") {
      const othRoute = db("se_project.routes")
        .where({ id: routeId, fromStationid: toST })
        .select("*")
        .first();

      if (!othRoute) {
        db("se_project.stations")
          .where({ id: toST })
          .update({ stationstatus: "inactive" })
          .returning("*");
        //change the position of the connected station
        db("se_project.stations")
          .where({ id: fromST })
          .update({ stationposition: tstation })
          .returning("*");
      }
    }

    try {
      const deleteRoute = await db("se_project.routes")
        .where({ id: routeId })
        .del()
        .returning("*");
      return res.status(200).json(deleteRoute);
    } catch (err) {
      console.log("eror message", err.message);
      return res.status(400).send("Could not delete route");
    }
  });
};
