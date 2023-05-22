const { isEmpty } = require("lodash");
const { v4 } = require("uuid");
const db = require("../../connectors/db");
const roles = require("../../constants/roles");
const { getSessionToken } = require('../../utils/session');
const { accessSync } = require("fs");
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
      const users = await db.select('*').from("se_project.users")

      return res.status(200).json(users);
    } catch (e) {
      console.log(e.message);
      return res.status(400).send("Could not get users");
    }
  });

  // -Update zone price PUT 
  app.put("/api/v1/zones/zoneId", async (req, res) => {
    const existZone = await db("se_project.route")
      .where({ id: zoneId })
      .select("*")
      .first();
    if (!existZone) {
      return res.status(400).send("Zone does not exist");
    }

    try {

      const { price } = req.body;
      const { zoneId } = req.params;
      const updateZonePrice = await db("se_project")
        .where("id", zoneId)
        .update({
          price: price
        }).returning("*");
      return res.status(200).json(updateZonePrice);

    }
    catch (err) {
      console.log("error message", err.message);
      return res.status(400).send("Could not update zone price"); //recheck
    }
  })

  // -Request refund PUT 

  app.put("/api/v1/requests/senior/:requestId", async (req, res) => {

  })
};
