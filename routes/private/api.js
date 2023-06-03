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

  // Check Price-----------------------------------------------------------------------------------------

  async function floydWarshall(adjMatrix) {
    const n = adjMatrix.length;
    const dist = [...adjMatrix];

    for (let k = 0; k < n; k++) {
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          if (
            dist[i][k] !== Infinity &&
            dist[k][j] !== Infinity &&
            dist[i][k] + dist[k][j] < dist[i][j]
          ) {
            dist[i][j] = dist[i][k] + dist[k][j];
          }
        }
      }
    }
    return dist;
  }

  //VIP
  async function create2dmatrix() {
    const stCount = await db("se_project.stations").count();
    let stCountint = parseInt(stCount[0]["count"]);
    let matrix = [];
    // console.log("lol");

    for (let i = 0; i < stCountint; i++) {
      // console.log("i:",i);
      matrix[i] = [];
      const existST1 = await db("se_project.stations")
        .where({ id: i + 1 })
        .select("*")
        .first();
      if (isEmpty(existST1)) {
        stCountint++;
        // continue;
      }
      for (let j = 0; j < stCountint; j++) {
        // console.log("stcount:",stCountint);
        // console.log("j:",j);
        const existRoute = await db("se_project.routes")
          .where({ fromstationid: i + 1, tostationid: j + 1 })
          .select("*")
          .first();

        const existST2 = await db("se_project.stations")
          .where({ id: j + 1 })
          .select("*")
          .first();

        if (isEmpty(existST2)) stCountint++;
        else if (!isEmpty(existRoute)) matrix[i][j] = 1;
        else if (i === j) matrix[i][j] = 0;
        else matrix[i][j] = Infinity;
      }
    }
    // console.log(matrix);
    return matrix;
  }

  //calculate the price of ride from origin to destination
  //notice that the price will differ.. if user is a subscriber, then it'll cost 1 ticket, else if is senior then apply discount
  //---------------------------------------------------------------------------
  // Check Price:
  app.get(
    "/api/v1/tickets/price/:originId/:destinationId",
    async (req, res) => {
      // < 9 stations = 5 gneh,
      // 10 - 16 stations = 7 gneh
      // > 16 stations = 10 gneh
      // 50% discount law senior
      try {
        const user = await getUser(req);
        const { originId, destinationId } = req.params;
        const originid = parseInt(originId);
        const destinationid = parseInt(destinationId);
        let startStation = await db
          .select("*")
          .from("se_project.stations")
          .where("id", "=", originid)
          .first();
        let endStation = await db
          .select("*")
          .from("se_project.stations")
          .where("id", "=", destinationid)
          .first();
        let matrix = await create2dmatrix();
        let distMatrix = await floydWarshall(matrix);
        const distance = distMatrix[originid][destinationid];
        let price;
        switch (true) {
          case distance <= 9:
            price = 5;
            break;
          case distance > 9 && distance <= 16:
            price = 7;
            break;
          default:
            price = 10;
        }
        if (user.isSenior) {
          price = price * 0.5;
        }
        
        // console.log(shortestPath);

        return res.status(200).json(price);
      } catch (err) {
        console.log(err.message);
        return res.status(400).send(err.message);
      }
    }
  );
};
