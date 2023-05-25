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
    const existTicket = await db.select("*").from("se_project.tickets").where( "id", ticketId) ;
    if(existTicket){
      const existRequest = await db.select("*").from("se_project.refund_requests").where( "ticketid", ticketId) ;
      if(!existRequest){
        const ticketPurchase =await db.select("amount").from("se_project.transactions").where( "purchasedIid", ticketId) ;
      if(ticketPurchase){
        refundAmount=ticketPurchase;
      }
      else{
        refundAmount=0;
      }
      const userId = await db.select("userId").from("se_project.tickets").where("id" , ticketId) ;  
      let status = "pending";
      let newRequest = {
        status,
        userId,
        refundAmount,
        ticketId,
    };
      const addedRequest = await db("se_project.refund_requests").insert(newRequest).returning("*");
      return res.status(201).json(addedRequest);
  } else{
    return res.status(409).send("there already exists a refund request for this ticket");
  }
}
     else{
      return res.status(400).send("there isnt a ticket with such ticket ID");
     }
  } catch (err){
      console.log("error message ",err.message);
      return res.status(400).send(err.message);
    }
  });
  app.post("/api/v1/senior/request", async (req, res)=>{
    try{
      const user = await getUser(req);
      const userId = user["id"] ;
      const existReq = await db.select("*").from("se_project.senior_requests").where( "userid" , userId) ;
    if (existReq) {
      return res.status(409).send("Request already submitted");
    }else{
      const {nationalId} = req.body;
      
      let status = "pending";
      let newSRequest = {
        status,
        userId,
        nationalId,
      };
      const addedSRequest = await db("se_project.senior_requests").insert(newSRequest).returning("*");
      return res.status(201).json(addedSRequest)
    } 
     }catch(err){
        console.log("error message ",err.message);
        return res.status(400).send(err.message);
    }
  


  })
  app.post("/api/v1/station", async (req, res) => {
    try{
      const { stationName } = req.body;
      const existstation = await db.select("*").from("se_project.stations").where( "stationname", stationName) ;
      if(existstation){
        console.log("station already exists")
        return res.status(409).send("there already exists a station with that name");
      }
      else{
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
        return res.status(201).json(addedStation);
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
      const existstation = await db.select("*").from("se_project.stations").where( "id", stationid) ;
      if(existstation){
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
  app.delete("/api/v1/station/:stationId", async (req,res)=>{
    try{
      const { stationid } = req.params;
      const existstation = await db.select("id").from("se_project.stations").where( "id", stationid);
      if(!existstation){
        return res.status(404).send("no station exists with such ID");
      }
      else{
        const stationT = await db.select("stationtype").from("se_project.stations").where( "id", stationid) ;
        if(stationT==="transfer"){
          const newTransfer = await db.select("fromStationid").from("se_project.routes").where( "toStationid", stationid).first();
          let newType = "transfer";
          const NormToTrans = await db("se_project.stations").where("id",newTransfer).update({stationtype:newType}).returning("id");
          const updatingTransfer= await db("se_project.routes")
          .where("fromStationid",stationid)
          .update({fromStationid:NormToTrans})
          .returning("*");
          const deleteDupeRoute = await db("se_project.routes")
          .where("fromStationid" , NormToTrans)
          .andWhere("toStationid" , NormToTrans)
          .del()
          .returning("*");
          const updateRS = await db("se_project.stationroutes")
          .where("stationid" , stationid)
          .update({stationid : NormToTrans})
          .returning("*");
          const deletedStation = await db("se_project.stations")
          .where("id" , stationid)
          .del()
          .returning("*");
          return res.status(200).json(deletedStation);
        }else{
          const stationP = await db.select("stationposition").from("se_project.stations").where( "id", stationid) ;
          if(stationP==="start"){
            const newStart= await db.select("toStationid").from("se_project.stations").where( "fromStationid" , existstation) ;
            let newPosition = "start";
            const updatedStart= await db("se_project.stations")
            .where( "id" , newStart)
            .update({ stationposition: newPosition})
            .returning("*");
            const unwantedRoute = await db.select("id").from("se_project.routes").where( "fromStationid", stationid).andWhere("toStationid" , stationid) ;
            const deleteRS  = await db("se_project.stationroutes")
            .where("routeid" , unwantedRoute)
            .del()
            .returning("*");
            const deletedStation = await db("se_project.stations")
            .where("id" , stationid)
            .del()
            .returning("*");
            return res.status(200).json(deletedStation);
          }
          else if(stationP==="end"){
            const newEnd= await db.select("fromStationid").from("se_project.stations").where( "toStationid" , existstation) ;
            let newPosition = "end";
            const updatedEnd= await db("se_project.stations")
            .where( "id" , newEnd)
            .update({ stationposition: newPosition})
            .returning("*");
            const unwantedRoute = await db.select("id").from("se_project.routes").where( "fromStationid", stationid).andWhere("toStationid" , stationid) ;
            const deleteRS  = await db("se_project.stationroutes")
            .where("routeid" , unwantedRoute)
            .del()
            .returning("*");
            const deletedStation = await db("se_project.stations")
            .where( "id" , stationid)
            .del()
            .returning("*");
            return res.status(200).json(deletedStation);
          }
          else{
            const newRS = await db.select("toStationid").from("se_project.stations").where( "fromStationid" , existstation) ;
            //const newRE = await db.select("fromStationid").from("se_project.stations").where( "toStationid" , existstation) ;
            const r1 = newRS[0];
            const r2 = newRS[1];
            let newRName = "new";
            let newRoute1 = {
              newRName,
              r1,
              r2, 
            };
            let newRoute2 = {
              newRName,
              r1,
              r2, 
            };
            const addedRoute1 = await db("se_project.routes").insert(newRoute1).returning("id");
            const addedRoute2 = await db("se_project.routes").insert(newRoute2).returning("id");
            const deletedStation = await db("se_project.stations")
            .where( "id" , stationid)
            .del()
            .returning("*");
            let newRstation={
              r1,
              addedRoute1,
            };
            let newRstation2={
              r2,
              addedRoute1,
            };
            let newRstation3={
              r1,
              addedRoute2,
            };
            let newRstation4={
              r2,
              addedRoute2,
            };
            const addedRS = await db("se_project.stationroutes").insert(newRstation).returning("*");
            const addedRS2 = await db("se_project.stationroutes").insert(newRstation2).returning("*");
            const addedRS3 = await db("se_project.stationroutes").insert(newRstation3).returning("*");
            const addedRS4 = await db("se_project.stationroutes").insert(newRstation4).returning("*");
            return res.status(200).json(deletedStation);
          }
        }
        }
    }catch(err){
      console.log("error message ",err.message);
      return res.status(400).send(err.message);
    }
  })
};
