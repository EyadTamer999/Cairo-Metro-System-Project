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
  console.log("hi",sessionToken);
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

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////start of changes


//POST pay for subscription online
const express= require("express");
// const db=require("../../connectors/db");
// const { default: db } = require("db");

const app=express();
app.use(express.json());//to be able to access req.body



///////////////////////////////////////////////////////////////end of changes



/////////////////////////////////////////////////////////////

module.exports = function (app) {
  // example
  app.put("/users", async function (req, res) {
    try {
        const user = await getUser(req);
        const users = await db.select('*').from("se_project.users")
        return res.status(200).json(user);
    } catch (e) {
        console.log(e.message);
        return res.status(400).send("Could not get users");
    }
});




//reset password for admin and user PUT 
//do not forget to edit the commented conditions
app.put("/api/v1/password/reset",
async (req,res)=>{
  try
  {
      const pass=req.body.password;
      const user=await getUser(req);
      const id=user.userid;
      const old_pass=user.password;
      console.log(user);
      
      if(pass === old_pass)
          {
              return res.status(400).send("you are entering your old password");

          }
      else if(pass==="")
          {
          return res.status(400).send("you have to enter a value to the password");

          }
      else
          {

          await db('se_project.users').where('id',id).update( {password:pass});
          const user1 =await db.select("*").from('se_project.users').where('id',id) ;  
          console.log(user1);                
          return res.status(201).json(user1);
              
          }
  }
  catch (e) 
        {
          console.log("Could not change password",e.message);
          return res.status(400).send(e.message);
        }
}
);



//            const user = await db("se_project.users").insert(newUser).returning("*");

//GET subscribtion GET zones Data
app.get("/api/v1/zones",
async (req,res)=>{
    try
        {
        const all_zones=await db.select("*").from('se_project.zones').returning("*") ;
        return res.status(200).json(all_zones);
        }
    catch (e) 
          {
            console.log("Could not get zones",e.message);
            return res.status(400).send(e.message);
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


app.post("/api/v1/payment/subscription",
async (req,res)=>{
try{
  const purchasedId=req.body.purchasedId;
  const creditCardNumber=req.body.creditCardNumber;
  const holderName=req.body.holderName;
  const payedAmount=req.body.payedAmount;
  const subType=req.body.subType;
  const zoneId=req.body.zoneId;

  
    const x=get_num_of_tickets(subType);
    const user=await getUser(req);
    const uid=user.userid;
    const existZone = await db("se_project.zones")
    .where({ id: zoneId })
    .select("*")
    .first();
  
    if (!existZone) 
    {
    return res.status(400).send("Zone does not exist");
    }

    if(purchasedId===null)
    {
      return res.status(400).send("you must entered purchasedId");
    }

    else if(creditCardNumber===null)
    {
      return res.status(400).send("you must entered creditCardNumber");
    }

    else if(holderName===null)
    {
      return res.status(400).send("you must enter the name of credit Card holder");
    }

    else if(payedAmount===null)
    {
      return res.status(400).send("you must enter the paid amount");
    }

    else if(subType!="annual" && subType!="month"&& subType!="quarterly" )
    {
      return res.status(400).send("you entered invalid subscription type you have only 3 types which are quarterly , month and annual");
    }

    

    else{
          ret=await db('se_project.subsription').insert({
            subType:subType,
            zoneId:zoneId,
            noOfTickets:x,
            userId:uid
          }).returning("*");

          ret2=await db('se_project.transactions').insert({
            amount:payedAmount,
            userId:uid,
            purchasedId:purchasedId
            

          }).returning("*");


          
          ret3=await db('se_project.creditCardDetails').insert({
            holder_name:holderName,
            userId:uid,
            transactions_id:purchasedId,
            creditCardNumber:creditCardNumber
            

          }).returning("*");
          
          

          ret=ret1.innerJoin(ret2).innerJoin(ret3);
          return res.status(201).json(ret);
  }
}
catch (e) {
  console.log("Could not buy online subscription",e.message);
  return res.status(400).send(e.message);
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
    
    const user=getUser(req);
    const uid=user.userid;



    if(purchasedId===null)
    {
      return res.status(400).send("you must entered purchasedId");
    }

    else if(creditCardNumber===null)
    {
      return res.status(400).send("you must entered creditCardNumber");
    }

    else if(holderName===null)
    {
      return res.status(400).send("you must enter the name of credit Card holder");
    }

    else if(payedAmount===null)
    {
      return res.status(400).send("you must enter the paid amount");
    }
    

    else if(tripDate===null)
    {
      return res.status(400).send("you must enter the trip date");

    }

    else if(origin==="")
    {
      return res.status(400).send("you must enter the origin");

    }

    else if(destination==="")
    {
      return res.status(400).send("you must enter the destination");

    }

    else{
          ret1=await db('se_project.subsription').insert({
            origin:origin,
            destination:destination,
            subID:null,//as we are paying online without subscription
            userId:uid,
            tripDate:tripDate


          }).returning("*");
          ret2=await db('se_project.transactions').insert({
            amount:payedAmount,
            userId:uid,
            purchasedId:purchasedId
            

          }).returning("*");
          

          ret3=await db('se_project.creditCardDetails').insert({
            holder_name:holderName,
            userId:uid,
            transactions_id:purchasedId,
            creditCardNumber:creditCardNumber
            

          }).returning("*");
          
          
          
          ret=ret1.innerJoin(ret2).innerJoin(ret3);
          return res.status(201).json(ret);
  }


} 
catch (e) {
  console.log("Could not buy online tickets",e.message);
  return res.status(400).send(e.message);
}
});











};
