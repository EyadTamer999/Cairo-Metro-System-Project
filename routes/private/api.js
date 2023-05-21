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

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////start of changes

const getUser_id = async function (req) {
  const sessionToken = getSessionToken(req);
  if (!sessionToken) {
    return res.status(301).redirect("/");
  }
  console.log("hi",sessionToken);
  const user = await db
    .select("userId")
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
    return user;
  }



//POST pay for subscription online
const express= require("express");
const Kenx=require("./db");
const { default: knex } = require("knex");

const app=express();
//const cors=require("cors");

//app.use(cors());
app.use(express.json());//to be able to access req.body



//reset password for admin and user PUT 
app.put("/api/v1/password/reset",
async (req,res)=>{
  try{
const {newPassword}=req.body;
const id=getUser_id(req);
knex('users').where('id',id).update(
  {password:newPassword}).then( ()=>
    Kenx.select().from('users')
    .where('id',id).then((user)=>
    {  res.send(user);}
    
    )
  )
}
catch (e) {
  console.log(e.message);
  return res.status(400).send("Could not change password");
}
}
);

//GET subscribtion GET zones Data
app.get("/api/v1/zones",
async (req,res)=>{
try{
knex.select().from('zones').then((zones)=>
{res.send(zones);})

}
catch (e) {
  console.log(e.message);
  return res.status(400).send("Could not get zones");
}

}


);



function get_num_of_tickets(subType)
{
  if(subType=="quarterly")
    return 50;
    else if(subType=="annual")
    return 100;
    else if(subType=="month")
    return 10;
    
}
//paying for subscription online need work 
app.post("/api/v1/payment/subscription",
async (req,res)=>{
try{
  const {purchasedId,//
    creditCardNumber,//
    holderName,//
    payedAmount,//
    subType,
    zoneId}=req.body;
    const x=get_num_of_tickets(subType);
    Kenx('subsription').insert({
      subType:subType,
      zoneId:zoneId,
      noOfTickets:x,
      //userId:



    });



}
catch (e) {
  console.log(e.message);
  return res.status(400).send("Could not buy online subscription");
}
}
);
//POST pay for ticket online

//paying for tickets online need work 
app.post("/api/v1/payment/ticket",
async (req,res)=>{
try{
  const {purchasedId,//Integer
    creditCardNumber,//Integer
    holderName,//string
    payedAmount,//integer
    origin,//string
    destination,//string
    tripDate //dateTime
    }=req.body;


} 
catch (e) {
  console.log(e.message);
  return res.status(400).send("Could not buy online tickets");
}
});






///////////////////////////////////////////////////////////////end of changes




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



  
};
