// import the knex library that will allow us to
// construct SQL statements
const knex = require('knex');
require("dotenv").config();

// define the configuration settings to connect
// to our local postgres server
// const config = {
//     client: 'pg',
//     connection: {
//         host: process.env.HOST,
//         port: process.env.PORT,
//         user: process.env.USERNAME,
//         password: process.env.PASSWORD,
//         database: process.env.DATABASE,
//         schema: process.env.SCHEMA
//     }
// };
//use for deployment
const config = {
    client: 'pg',
    connection: process.env.PG_CONNECTION_STRING,
};

// create the connection with postgres
const db = knex(config);
// expose the created connection, so we can
// use it in other files to make sql statements
module.exports = db;