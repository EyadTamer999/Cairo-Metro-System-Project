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

////done


//reset password for admin and user PUT 
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
//done
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

  console.log(payedAmount);
    const x=get_num_of_tickets(subType);
    const user=await getUser(req);
    const uid=user.userid;
    const existZone = await db.select("*").from("se_project.zones")
    .where({ id: zoneId });

    console.log(user.isSenior);
    if(user.isSenior)
    {
      payedAmount=payedAmount*0.9 ;
    }
    console.log(payedAmount);
    if (isEmpty(existZone)) 
    {
    return res.status(400).send("Zone does not exist");
    }

    else if(purchasedId===null)
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

          ret1=await db('se_project.subsription').insert({
            subtype:subType,
            zoneid:zoneId,
            nooftickets:x,
            userid:uid
          }).returning("*");



          ret2=await db('se_project.transactions').insert({
            amount:payedAmount,
            userid:uid,
            purchasedid:purchasedId
            

          }).returning("*");
          

          ret3=await db('se_project.creditcarddetails').insert({
            holder_name:holderName,
            userid:uid,
            creditcardnumber:creditCardNumber
            

          }).returning("*");
          



          ret={subType,zoneId,x,uid,payedAmount,purchasedId,holderName,creditCardNumber};
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
    
    const user=await getUser(req);
    const uid=user.userid;
    console.log("Daaaaaaaaaaaaaaaaaaaaaaaaaam");
    console.log(uid);

    const existsubsription = await db.select("*").from("se_project.subsription").where('userid',uid);
    if(!isEmpty(existsubsription))
    {
      return res.status(400).send("user have subscription");

    }
  else{  
          console.log(user.isSenior);
          if(user.isSenior)
          {
            payedAmount=payedAmount*0.9 ;
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

          else if(destination==origin)
          {
            return res.status(400).send("invalid trip");
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

          //TODO checkprice before inserting   
          else{
                ret1=await db('se_project.tickets').insert({
                  origin:origin,
                  destination:destination,
                  subid:null,//as we are paying online without subscription
                  userid:uid,
                  tripdate:tripDate


                }).returning("*");
                console.log(ret1);
                ret2=await db('se_project.transactions').insert({
                  amount:payedAmount,
                  userid:uid,
                  purchasedid:purchasedId
                  

                }).returning("*");
                

                ret3=await db('se_project.creditcarddetails').insert({
                  holder_name:holderName,
                  userid:uid,
                  creditcardnumber:creditCardNumber
                  

                }).returning("*");



                
                ret4=await db('se_project.rides').insert({
                  status:"activated",
                  origin:origin,
                  destination:destination,
                  userid:uid,
                //TODO HOW to get ticketid
                  ticketid:ret1.id,
                  tripdate:tripDate
                  

                }).returning("*");
                
                
                
                ret={origin,destination,uid,tripDate,payedAmount,purchasedId,holderName,creditCardNumber};
                return res.status(201).json(ret);
        }
  }

} 
catch (e) {
  console.log("Could not buy online tickets",e.message);
  return res.status(400).send(e.message);
}
});




};
