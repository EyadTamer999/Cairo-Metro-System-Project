const db = require("./db");
async function uploadSR() {

  let SR = [
    { stationid: 1, routeid: 1 },
    { stationid: 1, routeid: 2 },
    { stationid: 2, routeid: 2 },
    { stationid: 2, routeid: 3 },
    { stationid: 3, routeid: 3 },
    { stationid: 3, routeid: 4 },
    { stationid: 3, routeid: 5 },
    { stationid: 3, routeid: 6 },
    { stationid: 3, routeid: 7 },
    { stationid: 3, routeid: 8},
    { stationid: 4, routeid: 5 },
    { stationid: 4, routeid: 6 },
    { stationid: 4, routeid: 9},
    { stationid: 4, routeid: 10 },
    { stationid: 5, routeid: 9 },
    { stationid: 5, routeid: 10 },
    { stationid: 6, routeid: 7 },
    { stationid: 6, routeid: 8 },
    { stationid: 6, routeid: 11 },
    { stationid: 6, routeid: 12 },
  ];
  for (let i = 0; i < SR.length; i++) {
    const element =SR[i];
    await db("se_project.stationroutes").insert(element).returning("*");
  }

}
async function uploadS() {
  let stations = [
    {
      stationname: "s1",
      stationtype: "normal",
      stationposition: "start",
      stationstatus: "old",
    },
    {
      stationname: "s2",
      stationtype: "normal",
      stationposition: "middle",
      stationstatus: "old",
    },
    {
      stationname: "s3",
      stationtype: "transfer",
      stationposition: "middle",
      stationstatus: "old",
    },
    {
      stationname: "s4",
      stationtype: "normal",
      stationposition: "middle",
      stationstatus: "old",
    },
    {
      stationname: "s5",
      stationtype: "normal",
      stationposition: "end",
      stationstatus: "old",
    },
    {
      stationname: "s6",
      stationtype: "normal",
      stationposition: "middle",
      stationstatus: "old",
    },
    {
      stationname: "s7",
      stationtype: "normal",
      stationposition: "end",
      stationstatus: "old",
    },
  ];

  for (let i = 0; i < stations.length; i++) {
    const element =stations[i];
    await db("se_project.stations").insert(element).returning("*");
  }
}
async function uploadR() {
    let routes = [
      { routename: "hi12", fromstationid: 1, tostationid: 2 },
      { routename: "hi21", fromstationid: 2, tostationid: 1 },
      { routename: "hi23", fromstationid: 2, tostationid: 3 },
      { routename: "hi32", fromstationid: 3, tostationid: 2 },
      { routename: "hi34", fromstationid: 3, tostationid: 4 },
      { routename: "hi43", fromstationid: 4, tostationid: 3 },
      { routename: "hi36", fromstationid: 3, tostationid: 6 },
      { routename: "hi63", fromstationid: 6, tostationid: 3 },
      { routename: "hi45", fromstationid: 4, tostationid: 5 },
      { routename: "hi54", fromstationid: 5, tostationid: 4 },
      { routename: "hi76", fromstationid: 7, tostationid: 6 },
      { routename: "hi67", fromstationid: 6, tostationid: 7 },
    ];
 
  for (let i = 0; i < routes.length; i++) {
    const element =routes[i];
    await db("se_project.routes").insert(element).returning("*");
  }
}
//uploadS(); first to run
//uploadR(); second
//uploadSR(); third