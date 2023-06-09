// import the knex library that will allow us to
// construct SQL statements
const knex = require('knex');
require("dotenv").config();

// define the configuration settings to connect
// to our local postgres server

//use this for local
const config = {
    client: 'pg',
    connection: {
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: '1234',
        database: 'se_project',
        schema: 'se_project'
    }
};

// //use this for deployment
// const config = {
//     client: 'pg',
//     connection: process.env.PG_CONNECTION_STRING,
// };

// create the connection with postgres
const db = knex(config);
// expose the created connection, so we can
// use it in other files to make sql statements
module.exports = db;