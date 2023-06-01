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

  //Check price and payment endpoints------------------------------------------------------------------------------------

  /*
  Lets try to go from station 1 to station 3
  A simulation with stationroutes:
    we will try getting the routes with station id = 1:
      the routes will be route 1 and route 2.
      we will then see the route that has the fromstation = 1
      thus it will be route 1

  
  */

      // async function calcPath(startST, endST){
      //   const distance = [];

      // }




  async function helper(
    fromStationId,
    toStationId,
    distances,
    previous,
    count,
    tempcount
  ) {
    console.log("entered helper method");
    const stations = await db("se_project.routes")
      .select("*")
      .where({ fromstationid: fromStationId });
      console.log("the routes connected to the fromstationid:",stations);
    for (let j in stations) {

      if (previous.includes(stations[j].tostationid)) continue;
      else {
        previous.push(stations[j].tostationid);
        console.log();
        const toStations = await db("se_project.routes")
          .select("tostationid")
          .where({ fromstationid: stations[j].id });
          console.log(toStations);
        if (Object.keys(toStations).length === 1) continue;
        else {
          const station = stations[j];
          count++;
          if (fromStationId === toStationId) {
            distances.push(count);
          } else {
            helper(station.id, toStationId, distances, previous, count);
          }
        }
        count = tempcount;
      }
    }
  }

  async function calculateShortestPath(
    fromStationId,
    toStationId,
    distances,
    previous,
    count
  ) {
    previous.push(fromStationId);
    console.log("entered the recursive method");
    const stations = await db("se_project.routes")
      .select("*")
      .where({ fromstationid: fromStationId });
      console.log("the routes connected to the fromstationid:",stations);
    for (let i in stations) {
      console.log("entering the main loop");
      console.log("distances array",distances);
      console.log("stations that already passed", previous);
      // console.log(stations[i])
      const stationss = await db("se_project.stations")
        .select("*")
        .where({ id: stations[i].tostationid });
        console.log("the tostations:", stationss)
        // console.log("the fromstations where the id is in the ", i,"iteration:", stationss);
        const stationtype = stationss.stationtype; 
      if (stationtype === "transfer") {
        console.log("station is transfer station");
        let tempcount = count;
        console.log("tempcount:",tempcount)
        helper(
          stationss.id,
          toStationId,
          distances,
          previous,
          count,
          tempcount
        );
      } else {
        if (previous.includes(stations[i].tostationid)) {
          console.log("already passed station", stations[i].tostationid);
          continue;
        } else {
          console.log("entering the else condition for if the station we are passing through is not the previous array")
          previous.push(stations[i].tostationid);
          console.log("stations that already passed:", previous);
          const toStations = await db("se_project.routes")
            .select("tostationid")
            .where({ fromstationid : stations[i].fromstationid });
            console.log("the tostations where the id is in the ", i,"iteration:",toStations);
          if (Object.keys(toStations).length === 1) continue;
          else {
            const station = stations[i];
            console.log("station in the ", i, "th iteration:",station);
            count++;
            console.log("the count:", count);
            if (station.fromstationid === toStationId) {
              distances.push(count);
              console.log("distances array",distances);
            } else {
              calculateShortestPath(
                station.id,
                toStationId,
                distances,
                previous,
                count
              );
            }
          }
          count = 0;
        }
      }
    }
    let minSoFar = distances[0];
    console.log(minSoFar);
    for (let i in distances) {
      if (distances[i] < minSoFar) minSoFar = distances[i];
      console.log(minSoFar);
    }

    return minSoFar;

    //test tomorrow
    //arrival

    /*
        we will add the stations stopped by in the previous array
        if we find one of the tostations in the previous array we will not execute recursion with it
        we will increment the count with visiting a station
        if we find the destination : increment the count in the distance array and break from the recursion
        else : recusion with the tostations
        for edge stations if the tostations is 1 only
        choose the min from the distances
        */
    // Fetch all stations from the database

    // Initialize distances with infinity, except for the source station which is 0
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
      //
      //run shortest path algo
      //select the stations and save them in an array, select the routes and save them in an array, and select the stations routes and save them in an array,
      //we need to mark where we can start.
      // https://www.geeksforgeeks.org/implementation-graph-javascript/
      // https://github.com/dagrejs/graphlib/wiki
      // https://www.npmjs.com/package/graphlib?activeTab=readme
      //i changed the link while testing cuz i think it wasnt working but give the original a try it's: /api/v1/tickets/price/:originId& :destinationId
      try {
        const { originId, destinationId } = req.params;
        const originid = parseInt(originId);
        const destinationid = parseInt(destinationId);
        let startStation = await db
          .select("*")
          .from("se_project.stations")
          .where("id", "=", originid).first();
          let endStation = await db
          .select("*")
          .from("se_project.stations")
          .where("id", "=", destinationid).first();
        //calculate the shortest path
        let distances = [];
        let previous = [];
        let shortestPath = await calculateShortestPath(
          startStation.id,
          endStation.id,
          distances,
          previous,
          0
        );

        // console.log(shortestPath);

        return res.status(200).json(shortestPath);
      } catch (err) {
        console.log( err.message);
        return res.status(400).send(err.message);
      }
    }
  );
};
