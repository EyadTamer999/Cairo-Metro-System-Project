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
      "se_project.sessions.userId",
      "se_project.users.id"
    )
    .innerJoin(
      "se_project.roles",
      "se_project.users.roleId",
      "se_project.roles.id"
    )
   .first();

  console.log("user =>", user);
  user.isNormal = user.roleId === roles.user;
  user.isAdmin = user.roleId === roles.admin;
  user.isSenior = user.roleId === roles.senior;
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
 
  /*
    Create api endpoints for admin :
    - Create routes
    - Update routes
    - Delete routes
  */

  // - Create routes:
  app.post("api/v1/route", async (req, res) => {

    // try to see if the route already exists
    const existRoute = await db("se_project.route")
      .where({ routeName: routeName })
      .select("*")
      .first();
    if (existRoute) {
      return res.status(400).send("Route already exists");
    }

    try{
      const {id, routeName, fromStationId, toStationId} = req.body;
      console.log(req.body);
      let newRoute = {
        id,
        routeName,
        fromStationId,
        toStationId
      };
      const addedRoute = await db.insert(newRoute).into("se_project.route").returning("*");
      console.log(addedRoute);
      return res.status(201).json(addedRoute);
    }
    catch(err){
      console.log("eror message", err.message);
      return res.status(400).send("Could not create route");
    }
  })

  // -Update route
  app.put("api/v1/route/:routeId", async (req, res) => {

    // try to see if the route already exists
    const existRoute = await db("se_project.route")
      .where({ routeName: routeName })
      .select("*")
      .first();
    if (!existRoute) {
      return res.status(400).send("Route does not exist");
    }

    try{
      const {routeName, fromStationId, toStationId} = req.body;
      const { routeId } = req.params;
      const updateRoute = await db("se_project")
      .where("id", routeId)
      .update({
        routeName : routeName,
        fromStationId : fromStationId,
        toStationId : toStationId
      })
      .returning("*");
      return res.status(200).json(updateRoute);
    }
    catch(err){
      console.log("eror message", err.message);
      return res.status(400).send("Could not update route");
    }
  })

  // -Delete route
  app.delete("api/v1/route/:routeId", async (req, res) => {

    // try to see if the route already exists
    const existRoute = await db("se_project.route")
      .where({ routeName: routeName })
      .select("*")
      .first();
    if (!existRoute) {
      return res.status(400).send("Route does not exist");
    }

    try{
      const { routeId } = req.params;
      const deleteRoute = await db("se_project").where("id", routeId).del().returning("*");
      console.log("deleted", deleteRoute);
      return res.status(200).json(deleteRoute);
    }
    catch(err){
      console.log("eror message", err.message);
      return res.status(400).send("Could not delete route");
    }
  })

  

  
};
