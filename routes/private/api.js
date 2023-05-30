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
const { log } = require("console");
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
  const creditCardNumber=req.body.creditCardNumber;
  const holderName=req.body.holderName;
  const payedAmount=req.body.payedAmount;
  const subType=req.body.subType;
  const zoneId=req.body.zoneId;

    const num_of_tickets=get_num_of_tickets(subType);
    const user=await getUser(req);
    const uid=user.userid;
    const existZone = await db.select("*").from("se_project.zones")
    .where({ id: zoneId });

    if(user.isSenior)
    {
      payedAmount=payedAmount*0.9 ;
    }
    if (isEmpty(existZone)) 
    {
    return res.status(400).send("Zone does not exist");
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

      const ret1=await db('se_project.subscription').insert({
            subtype:subType,
            zoneid:zoneId,
            nooftickets:num_of_tickets,
            userid:uid
          }).returning("*");


          const id_trip=Number(ret1[0]["id"]);

          const ret2=await db('se_project.transactions').insert({
            amount:payedAmount,
            userid:uid,
            purchasedid:toString(id_trip),
            purchasetype:"subscription"           

          }).returning("*");
          

          const  ret3=await db('se_project.creditcarddetails').insert({
            holder_name:holderName,
            userid:uid,
            creditcardnumber:creditCardNumber
            

          }).returning("*");
          



          const ret={num_of_tickets};
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



  const {
    creditCardNumber,//Integer
    holderName,//string
    payedAmount,//integer

    origin,//string
    destination,//string
    tripDate //dateTime
    }=req.body;
    
    const user=await getUser(req);
    const uid=user.userid;
    

    const existsubsription = await db.select("*").from("se_project.subscription").where('userid',uid);
    if(!isEmpty(existsubsription))
    {
      return res.status(400).send("user have subscription");

    }
  else{  
          if(user.isSenior)
          {
            payedAmount=payedAmount*0.9 ;
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
                const ret1=await db('se_project.tickets').insert({
                  origin:origin,
                  destination:destination,
                  subid:null,//as we are paying online without subscription
                  userid:uid,
                  tripdate:tripDate


                }).returning("*");


                const id_trip=Number(ret1[0]["id"]);

                const  ret2=await db('se_project.transactions').insert({
                  amount:payedAmount,
                  userid:uid,
                  purchasedid:toString(id_trip),
                  purchasetype:"ticket"        
                  

                }).returning("*");
                

                const ret3=await db('se_project.creditcarddetails').insert({
                  holder_name:holderName,
                  userid:uid,
                  creditcardnumber:creditCardNumber
                  

                }).returning("*");



                
                const  ret4=await db('se_project.rides').insert({
                  status:"activated",
                  origin:origin,
                  destination:destination,
                  userid:uid,
                  ticketid:id_trip,
                  tripdate:tripDate
                  
                }).returning("*");

                const subscribtion_cost=1;//TODO call CheckPrice
                const origin_id=await db.select("id").from('se_project.stations').where('stationname',origin) ;
                const des_id=await db.select("id").from('se_project.stations').where('stationname',destination) ;
                console.log("ya ana mabdoon");
                console.log(des_id);
                
                console.log(origin_id);
                console.log("ya ana mabdoon");

                if(!isEmpty(origin_id) && !isEmpty(des_id) ){
                const potential_routs_data=await db.select("*").from('se_project.routes').where('toStationid',des_id  ).where('fromStationid',origin_id) ;//ret2
              
                
                const t="transfer";

               // const day=tripDate.getDay();
                
                const transfer_stations=await db.select("stationname").from('se_project.stations').where('stationtype',t) ;//ret3
                //const todayCloseDate = DF.format(new Date(), 'yyyy-MM-dd');

                //const upcome_rides=await db.select("*").from('se_project.rides').where('tripdate',t    ) ;//TODO ret4 not finished

                //  { tripdate >= currentdate}   
                //1-full ticket price, check price
                //2-route 
                //3-transfer stations, 
                //4-upcoming ride on the date of the ticket

                const ret={subscribtion_cost,potential_routs_data,transfer_stations  };//and add the pricecheck price ,upcome_rides 
                return res.status(201).json(ret);

              }
              else{
                return res.status(400).send("origin or destination is invalid station");

              }
        }
  }

} 
catch (e) {
  console.log("Could not buy online tickets",e.message);
  return res.status(400).send(e.message);
}
});

//ok so, the purchasetype is set to cash or subscription rather than 0 or 1 in your code and also any purchase made with a
// subscription should always have an amount of 1
  // -Request refund PUT 
//: Undefined binding(s) detected when compiling FIRST. Undefined column(s): [id] query: select * from "se_project"."refund_requests" where "id" = ? limit ?
  app.put("/api/v1/requests/refunds/:requestId", async (req, res) => {    
    const  requestId =parseInt( req.params.requestId);//Number(ret1[0]["id"]);


    const existRequest = await db("se_project.refund_requests")
      .where({ id: requestId })
      .select("*")
      .first();
    if (isEmpty( existRequest) ) {
      return res.status(400).send("Refund request does not exist");
    }

    try {
      //check if the ticket associated with the refund request has a future trip date
      const ticket = await db("se_project.tickets")
        .where({ id: existRequest.ticketid })
        .select("*")
        .first();
      if (ticket.tripdate <= new Date()) {
        return res.status(400).send("Only future-dated tickets can be refunded"); //should i also return rejected with it or not
      }

      const { status: refundStatus } = req.body;
      if (refundStatus !== "accepted" && refundStatus !== "rejected") {
        return res.status(400).send("Invalid status value");
      }
      const stat = await db("se_project.refund_requests")
        .where("id", requestId)
        .returning("status")

      const updateRefundRequestStatus = await db("se_project.refund_requests")
        .where("id", requestId)
        .update({ status: refundStatus })
        .returning("*");
      if (stat === "accepted") {
        return res.status(400).send("Request has already been accepted");
      }
      if (stat === "rejected") {
        return res.status(400).send("Request has already been accepted");
      }

      // Check if the user has a subscription
      const subscription = await db("se_project.subscription")
        .where({ userid: existRequest.userid })
        .select("*")
        .first();

      if (!isEmpty( subscription) ) {
        //get the number of tickets and insert it into a variable 
        const numberoftickets = await db("se_project.subscription")
          .where({ userid: existRequest.userid })
          .returning("nooftickets");

        //refund with subscription

        //getting remaining values
        const refundamount = await db("se_project.transaction")
          .where({ userid: existRequest.userid })
          .returning("amount");

        const purchasedIid = await db("se_project.transaction")
          .where({ userid: existRequest.userid })
          .returning("purchasedid");

        await db('se_project.transactions').insert({
          amount: (numberoftickets + 1),
          userid: existRequest.userid,
          purchasedIid: purchasedIid,
          purchasetype: "subscription"
        })
          .returning('*');
          
        } else {
        //refund with online payment

        await db('se_project.transactions').insert({
          amount: (-refundamount),
          userid: existRequest.userid,
          purchasedid: purchasedIid,
          purchasetype: "transaction"
        })
          .returning('*');

      }

      return res.status(200).json(updateRefundRequestStatus);
    } catch (err) {
      console.log("error message", err.message);
      return res.status(400).send("Could not update refund request status");
    }
  });


// -Request Senior PUT

    app.put("/api/v1/requests/senior/:requestId", async (req, res) => {
        const  requestId =parseInt( req.params.requestId);//Number(ret1[0]["id"]);

        let status = await db("se_project.senior_requests")
            .where({id: requestId})
            .select("status")
            .first();

        if (status['status'] === 'accepted') {
            return res.status(400).send("Senior request has already been accepted");
        }
        if (status['status'] === 'rejected') {
            return res.status(400).send("Senior request has already been rejected");
        }

        const existRequest = await db("se_project.senior_requests")
            .where({id: requestId})
            .select("*")
            .first();
        if (isEmpty( existRequest)) {
            return res.status(400).send("Senior request does not exist");
        }
        try {
            const user = await getUser(req);
            // console.log(user)
            const seniorUser = await db.select('*').from('se_project.senior_requests').where('userid', '=', user['userid'])
            console.log(seniorUser)
            let userNID = seniorUser[0]['nationalid'].toString();
            // console.log(userNID)
            if (userNID[0] < 3) {
                let userBYear = parseInt("19" + userNID.substring(1, 3));

                // console.log(userBYear)

                //year has to be less than 63
                thisYear = parseInt(new Date().getFullYear())
                if (thisYear - userBYear >= 60) {
                    //kda checks out and he's a senior
                    status = 'accepted'

                    const updateUserRoleToSenior = await db("se_project.users").where('id', '=', user['userid']).update({
                        roleid: 3
                    })


                } else {
                    status = 'rejected'
                }
            } else {
                status = 'rejected'
            }
            const updateSeniorRequestStatus = await db("se_project.senior_requests")
                .where("id", requestId)
                .update({status: status})
                .returning("*");
            return res.status(200).json(status);

        } catch (err) {
            console.log("error message", err.message);
            return res.status(400).send("Could not update senior request");
        }
    });


  // -Update zone price PUT 

  app.put("/api/v1/zones/:zoneId", async (req, res) => {
    const  zoneId =parseInt( req.params.zoneId);//Number(ret1[0]["id"]);

    const existZone = await db("se_project.zones")
      .where({ id: zoneId })
      .select("*")
      .first();
    if (isEmpty( existZone)) {
      console.log("dammmmmmmmmmmmmm");
      return res.status(400).send("Zone does not exist");
    }

    try {
      const { price } = req.body;
      const updateZonePrice = await db("se_project.zones")
        .where("id", zoneId)
        .update({
          price: price
        }).returning("*");
        console.log(updateZonePrice);

      return res.status(200).json(updateZonePrice);

    }
    catch (err) {
      console.log("error message", err.message);
      return res.status(400).send("Could not update zone price"); //recheck
    }
  })
/*

    origin,//string
    destination,//string
    tripDate //dateTime



CREATE TABLE IF NOT EXISTS se_project.rides
(
    id SERIAL NOT NULL,
    status text NOT NULL,
    origin text NOT NULL, 
    destination text NOT NULL, 
    userid INTEGER NOT NULL,
    ticketid integer not null,
    tripdate timestamp not null,
    FOREIGN KEY( userid ) REFERENCES se_project.users,
    FOREIGN KEY( ticketid ) REFERENCES se_project.tickets,
    CONSTRAINT rides_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS se_project.routes
(
    id SERIAL NOT NULL,
    routename text Not null,
    fromStationid INTEGER NOT NULL,
    toStationid INTEGER NOT NULL, 
    CONSTRAINT routes_pkey PRIMARY KEY (id),
    FOREIGN KEY( fromStationid ) REFERENCES se_project.stations on DELETE CASCADE on UPDATE CASCADE,
    FOREIGN KEY( toStationid ) REFERENCES se_project.stations  on DELETE CASCADE on UPDATE CASCADE

);

CREATE TABLE IF NOT EXISTS se_project.stations
(
    id SERIAL NOT NULL,
    stationname text NOT NULL,
    stationtype text NOT NULL, -- normal or transfer
    stationposition text, -- start middle end
    stationstatus text not null, -- new created or not
    CONSTRAINT stations_pkey PRIMARY KEY (id)
);

*/ 

};
