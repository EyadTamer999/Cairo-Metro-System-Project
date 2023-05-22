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
            const users = await db.select('*').from("se_project.users")

            return res.status(200).json(users);
        } catch (e) {
            console.log(e.message);
            return res.status(400).send("Could not get users");
        }
    });

  app.post("/api/v1/refund/:ticketId", async (req, res) => {
    try{
      //check if ticket date is upcoming or not
    const { ticketId } = req.params;
    if(!ticketId){
      //todo refund amount in request refund table
      const userId = await db.select("userId").from("tickets").where("id" , ticketId) ;  
      let status = "pending";
      let newRequest = {
        status,
        userId,
        //refundAmount,
        ticketId,
    };
      const addedRequest = await db("refund_requests").insert(newRequest).returning("*");
      return res.status(201).json(addedRequest);
  }
     else{
      return res.status(409).send("there already exists a refund request for this ticket");
     }
  } catch (err){
      console.log("error message ",err.message);
      return res.status(400).send(err.message);
    }
  });
  app.post("/api/v1/senior/request", async (req, res)=>{
    try{
      const {nationalId} = req.body;
      const user = getUser;
      const userId = user.id;
      let status = "pending";
      let newSRequest = {
        status,
        userId,
        nationalId,
      };
      const addedSRequest = await db("se_project.senior_requests").insert(newSRequest).returning("*");
      return res.status(201).json(addedSRequest)
    } catch(err){
        console.log("error message ",err.message);
        return res.status(400).send(err.message);
    }
  


  })
  app.post("/api/v1/station", async (req, res) => {
    try{
      const { stationName } = req.body;
      if(!stationName){
      let type = 'normal';
      let position = null
      let status = 'new';
      let newStation = {
        stationName,
        type,
        position,
        status,
      };
      const addedStation = await db("se_project.stations").insert(newStation).returning("*");
      return res.status(201).json(addedStation);}
      else{
        console.log("station already exists")
        return res.status(409).send("there already exists a station with that name");
      }
    }
    catch(err){
      console.log("error message ",err.message);
      return res.status(400).send(err.message);
    }
  })  
  app.put("/api/v1/station/:stationId", async (req, res) => {
    try{
      const { stationid } = req.params;
      if(stationid){
        const { stationname1 } = req.body;
        const updatedStation = await db("se_project.stations")
        .where("id" , stationid)
        .update({
          stationname: stationname1,
        })
        .returning("*");
        return res.status(200).json(updatedStation);
      }
      else{
        return res.status(404).send("no station exists with such ID");
      }
    }catch(err){
      console.log("error message ",err.message);
      return res.status(400).send(err.message);
    }
  })
  app.delete("/api/v1/station/:stationId", async (req,res){
    try{
      const { stataionid } = req.params;
      if(stataionid){
//todo delete station
      }
      else{
        return res.status(404).send("no station exists with such ID");
      }
    }catch(err){
      console.log("error message ",err.message);
      return res.status(400).send(err.message);
    }
  })
};
