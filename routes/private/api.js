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
      const { stationname } = req.body;
      console.log(stationname);
      const existstation =await db("se_project.stations")
      .where({ stationname: stationname })
      .select("*")
      .first();
      if(existstation){
        console.log("station already exists")
        return res.status(409).send("there already exists a station with that name");
      }
      else{
        let stationtype = 'normal';
        let stationposition = null
        let stationstatus = 'new';
        let newStation = {
          stationname,
          stationtype,
          stationposition,
          stationstatus,
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
      const { stationId } = req.params;
      const stationid = parseInt(stationId);
      const { stationname } = req.body;
      const existstation =await db("se_project.stations")
      .where({ id: stationid })
      .select("*")
      .first();
      if(existstation){
        const updatedStation = await db("se_project.stations")
        .where("id" , stationid)
        .update({stationname: stationname})
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
      const { stationId } = req.params;
      const stationid2 = parseInt(stationId);
      
      const existstation =await db("se_project.stations")
      .where({ id: stationid2 })
      .select("*")
      .first();      
      if(!existstation){
        return res.status(404).send("no station exists with such ID");
      }
      else{
        //const stationT = await db.select("*").from("se_project.stations").where( "id", stationid2) ;
        if(existstation.stationtype==="transfer"){
          const newTransfer = await db.select("*").from("se_project.routes").where( "tostationid", stationid2).first();
          let stationtype = "transfer";
          const NormToTrans = await db("se_project.stations").where("id",newTransfer.fromstationid).update({stationtype:stationtype}).returning("*");
          const fromstationid = NormToTrans.id;
          let tostationid = NormToTrans.id;
          let stationid = NormToTrans.id;
          const updatingTransfer= await db("se_project.routes")
          .where("fromstationid",stationid2)
          .update({fromstationid : fromstationid})
          .returning("*");
          const deleteDupeRoute = await db("se_project.routes")
          .where("fromstationid" , NormToTrans.id)
          .andWhere("tostationid" , NormToTrans.id)
          .del()
          .returning("*");
          const updateRS = await db("se_project.stationroutes")
          .where("stationid" , stationid2)
          .update({stationid : NormToTrans.id})
          .returning("*");
          const deletedStation = await db("se_project.stations")
          .where("id" , stationid2)
          .del()
          .returning("*");
          return res.status(200).json(deletedStation);
        }else{
          console.log(stationid2);
          //const stationP = await db.select("*").from("se_project.stations").where( "id", stationid2) ;
          if(existstation.stationposition==="start"){
            const newStart= await db.select("*").from("se_project.routes").where( "fromstationid" , existstation.id) ;
            let stationposition = "start";
            const updatedStart= await db("se_project.stations")
            .where( "id" , newStart.tostationid)
            .update({ stationposition: stationposition})
            .returning("*");
            const unwantedRoute = await db.select("*").from("se_project.routes").where( "fromstationid", stationid2).orWhere("tostationid" , stationid2) ;
            const deleteRS  = await db("se_project.stationroutes")
            .where("routeid" , unwantedRoute.id)
            .del()
            .returning("*");
            const deletedStation = await db("se_project.stations")
            .where("id" , stationid2)
            .del()
            .returning("*");
            return res.status(200).json(deletedStation);
          }
          else if(existstation.stationposition==="end"){
            const newEnd= await db.select("*").from("se_project.routes").where( "tostationid" , existstation.id) ;
            let stationposition = "end";
            const updatedEnd= await db("se_project.stations")
            .where( "id" , newEnd.fromstationid)
            .update({ stationposition: stationposition})
            .returning("*");
            const unwantedRoute = await db.select("*").from("se_project.routes").where( "fromstationid", stationid2).orWhere("tostationid" , stationid2) ;
            const deleteRS  = await db("se_project.stationroutes")
            .where("routeid" , unwantedRoute.id)
            .del()
            .returning("*");
            const deletedStation = await db("se_project.stations")
            .where( "id" , stationid2)
            .del()
            .returning("*");
            return res.status(200).json(deletedStation);
          }
          else{
            //const newRS = await db.select("tostationid").from("se_project.routes").where( "fromstationid" , existstation.id) ;
            const newRS = await db.select("*").from("se_project.routes").where( "tostationid" , existstation.id) ;
            let fromstationid = newRS[0].id;
            let tostationid = newRS[1].id;
            let routename = "new";
            let newRoute1 = {
              routename,
              fromstationid,
              tostationid, 
            };
             fromstationid = newRS[1].id;
             tostationid = newRS[0].id;
            let newRoute2 = {
              routename,
              fromstationid,
              tostationid, 
            };
            const addedRoute1 = await db("se_project.routes").insert(newRoute1).returning("*");
            const addedRoute2 = await db("se_project.routes").insert(newRoute2).returning("*");
            const deletedStation = await db("se_project.stations")
            .where( "id" , stationid2)
            .del()
            .returning("*");
            let routeid = addedRoute1.id;
            routeid = addedRoute2.id;
            let stationid = tostationid;
            let newRstation={
              stationid,
              routeid,
            };
            routeid = addedRoute2.id;
            stationid = fromstationid;
            let newRstation2={
              stationid,
              routeid,
            };
            routeid = addedRoute1.id;
            stationid = tostationid;
            let newRstation3={
              stationid,
              routeid,
            };
            routeid = addedRoute2.id;
            stationid = fromstationid;
            let newRstation4={
              stationid,
              routeid,
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
