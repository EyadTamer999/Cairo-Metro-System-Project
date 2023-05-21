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

  app.post("/refund/:ticketId", async (req, res) => {
    try{
    const { ticketId } = req.params;
    //todo refund amount in request refund table
    const userId = await db.select("userId").from("tickets").where("id" , ticketId) ;  
    let status = "pending approval or rejection";
    let newRequest = {
      status,
      userId,
      //refundAmount,
      ticketId,
    };
    const addedRequest = await db("refund_requests").insert(newRequest).returning("*");
    return res.status(201).json(addedRequest);  
  } catch (err){
      console.log("error message ",err.message);
      return res.status(400).send(err.message);
    }
  });
  app.post("/senior/request", async (req, res)=>{
    try{
      const nationalId = req.body;
      
    } catch(err){
        console.log("error message ",err.message);
        return res.status(400).send(err.message);
    }



  })

  
};
