const db = require("./db");
async function uploadSR() {

  let SR = [
    { stationId: 1, routeId: 1 },
    { stationId: 1, routeId: 2 },
    { stationId: 2, routeId: 2 },
    { stationId: 2, routeId: 3 },
    { stationId: 3, routeId: 3 },
    { stationId: 3, routeId: 4 },
    { stationId: 3, routeId: 5 },
    { stationId: 3, routeId: 6 },
    { stationId: 3, routeId: 7 },
    { stationId: 3, routeId: 8},
    { stationId: 4, routeId: 5 },
    { stationId: 4, routeId: 6 },
    { stationId: 4, routeId: 9},
    { stationId: 4, routeId: 10 },
    { stationId: 5, routeId: 9 },
    { stationId: 5, routeId: 10 },
    { stationId: 6, routeId: 7 },
    { stationId: 6, routeId: 8 },
    { stationId: 6, routeId: 11 },
    { stationId: 6, routeId: 12 },
  ];
  for (let i = 0; i < SR.length; i++) {
    const element =SR[i];
    await db("seCS_project.stationRoutes").insert(element).returning("*");
  }
}
async function uploadS() {
  let stations = [
    {
      stationName: "s1",
      stationType: "normal",
      stationPosition: "start",
      stationStatus: "old",
    },
    {
      stationName: "s2",
      stationType: "normal",
      stationPosition: "middle",
      stationStatus: "old",
    },
    {
      stationName: "s3",
      stationType: "transfer",
      stationPosition: "middle",
      stationStatus: "old",
    },
    {
      stationName: "s4",
      stationType: "normal",
      stationPosition: "middle",
      stationStatus: "old",
    },
    {
      stationName: "s5",
      stationType: "normal",
      stationPosition: "end",
      stationStatus: "old",
    },
    {
      stationName: "s6",
      stationType: "normal",
      stationPosition: "middle",
      stationStatus: "old",
    },
    {
      stationName: "s7",
      stationType: "normal",
      stationPosition: "end",
      stationStatus: "old",
    },
  ];

  for (let i = 0; i < stations.length; i++) {
    const element =stations[i];
    await db("seCS_project.stations").insert(element).returning("*");
  }
}
async function uploadR() {
    let routes = [
      { routeName: "hi12", fromStationId: 1, toStationId: 2 },
      { routeName: "hi21", fromStationId: 2, toStationId: 1 },
      { routeName: "hi23", fromStationId: 2, toStationId: 3 },
      { routeName: "hi32", fromStationId: 3, toStationId: 2 },
      { routeName: "hi34", fromStationId: 3, toStationId: 4 },
      { routeName: "hi43", fromStationId: 4, toStationId: 3 },
      { routeName: "hi36", fromStationId: 3, toStationId: 6 },
      { routeName: "hi63", fromStationId: 6, toStationId: 3 },
      { routeName: "hi45", fromStationId: 4, toStationId: 5 },
      { routeName: "hi54", fromStationId: 5, toStationId: 4 },
      { routeName: "hi76", fromStationId: 7, toStationId: 6 },
      { routeName: "hi67", fromStationId: 6, toStationId: 7 },
    ];
  
  for (let i = 0; i < routes.length; i++) {
    const element =routes[i];
    await db("seCS_project.routes").insert(element).returning("*");
  }
}
//uploadS();
//uploadR();
//uploadSR();
