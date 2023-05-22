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


  // -Request refund PUT 


  app.put("/api/v1/requests/refund/:requestId", async (req, res) => {
    const { requestId } = req.params;
    const existRequest = await db("se_project.refund_requests")
      .where({ id: requestId })
      .select("*")
      .first();
    if (!existRequest) {
      return res.status(400).send("Refund request does not exist");
    }
    try {
      const { status: refundStatus } = req.body;
      if (refundStatus !== "accepted" && refundStatus !== "rejected") {
        return res.status(400).send("Invalid status value");
      }
      const updateRequestStatus = await db("se_project.refund_requests")
        .where("id", requestId)
        .update({ status: refundStatus })
        .returning("*");
      return res.status(200).json(updateRequestStatus);
    } catch (err) {
      console.log("error message", err.message);
      return res.status(400).send("Could not update refund request status");
    }

  });

  // -Request Senior PUT
  app.put("/api/v1/senior_requests/:requestId/:status", async (req, res) => {
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
      const updateRequestStatus = await db("se_project.senior_requests")
        .where("id", requestId)
        .update({ status: status })
        .returning("*");
      return res.status(200).json(updateRequestStatus);
    } catch (err) {
      console.log("error message", err.message);
      return res.status(400).send("Could not update senior request");
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
}