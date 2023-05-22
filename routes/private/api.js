const { isEmpty } = require("lodash");
const { v4 } = require("uuid");
const db = require("../../connectors/db");
const roles = require("../../constants/roles");
const {getSessionToken}=require('../../utils/session')
const getUser = async function (req) {
  const sessionToken = getSessionToken(req);
  if (!sessionToken) {
    return res.status(301).redirect("/");
  }
  console.log("hi",sessionToken);
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
 
  /*
    Create api endpoints for admin :
    - Create routes
    - Update routes
    - Delete routes
  */

  // - Create routes:  DONE BUT NOT SURE NEED SOME OPINIONS
  app.post("api/v1/route", async (req, res) => {

    // I did not only insert into the routes table, I to inserted into the stationsroutes  

    // need to check whethter the user is an admin or not
    if (!getUser.isAdmin)
      return res.status(403);

    // try to see if the route already exists
    const existRoute = await db("se_project.route")
      .where({ routeName: routeName })
      .select("*")
      .first();
    if (existRoute) {
      return res.status(409).send("Route already exists");
    }

    try{
      const {routeName, fromStationId, toStationId} = req.body;
      console.log(req.body);
      let newRoute = {
        routeName,
        fromStationId,
        toStationId
      };

      
      const addedRoute = await db.insert(newRoute).into("se_project.route").returning("*");
      const getRouteID = await db("se_project.route")
      .where({routeName : newRoute.routeName,
              fromStationId : newRoute.fromStationId,
              toStationId : newRoute.toStationId})
              .select("id")
              .first();
      let SR1 = {
        routeId : getRouteID.id,
        stationId : newRoute.fromStationId
      };

      let SR2 = {
        routeId : getRouteID.id,
        stationId : newRoute.toStationId
      };

      const addedSR1 = await db.insert(SR1).into("se_project.stationroutes").returning("*");
      const addedSR2 = await db.insert(SR2).into("se_project.stationroutes").returning("*");


      return res.status(200).json(addedRoute, addedSR1, addedSR2);
    }
    catch(err){
      return res.status(400).send("Could not create route");
    }
  })

  // -Update route:  DONE
  app.put("api/v1/route/:routeId", async (req, res) => {

      // need to check whethter the user is an admin or not
      if (!getUser.isAdmin)
        return res.status(403);
  

    // try to see if the route already exists
    const existRoute = await db("se_project.route")
      .where({ routeName: routeName })
      .select("*")
      .first();
    if (!existRoute) {
      return res.status(404).send("Route does not exist");
    }

    try{
      const {routeName} = req.body;
      const { routeId } = req.params;
      const updateRoute = await db("se_project")
      .where("id", routeId)
      .update({
        routeName : routeName,
      })
      .returning("*");
      return res.status(200).json(updateRoute);
    }
    catch(err){
      console.log("eror message", err.message);
      return res.status(400).send("Could not update route");
    }
  })

  // -Delete route: NOT DONE
  app.delete("api/v1/route/:routeId", async (req, res) => {

    /*
    The code down below will need some editing 
      -the first edit is that when deleting in the forward direction <-:
        -i will set the strt station status as inactive
        -then i will set the station connected to it as the new start of the route
      -the second edit that i will do is when deleting the station forwards ->:
        -i will set the end station status as inactive
        -then i will set the station connected to it as the new end of the route

    These changes need to be done ASAP
    anybody looking at this branch the api endpoint is stil not done implementing
    */

    // need to check whethter the user is an admin or not
    if (!getUser.isAdmin)
      return res.status(403);

    // try to see if the route already exists
    const existRoute = await db("se_project.route")
      .where({ routeName: routeName })
      .select("*")
      .first();
    if (!existRoute) {
      return res.status(404).send("Route does not exist");
    }

    try{
      const { routeId } = req.params;
      const deleteRoute = await db("se_project").where("id", routeId).del().returning("*");

      return res.status(200).json(deleteRoute);
    }
    catch(err){
      console.log("eror message", err.message);
      return res.status(400).send("Could not delete route");
    }
  })

  

  
};
