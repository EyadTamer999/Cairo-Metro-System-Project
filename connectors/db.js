// import the knex library that will allow us to
// construct SQL statements
const knex = require('knex');

// define the configuration settings to connect
// to our local postgres server
const config = {
    client: 'pg',
    connection: {
        name:'se_project',
        host: 'dpg-cht4ft0rddlc2m8npetg-a.frankfurt-postgres.render.com',
        port: 5432,
        user: 'se_project_user',
        password: 'efDlZPKQAoXDJcvAk2DiNRphOhOuVF4r',
        database: 'se_project',
        schema: 'se_project'
    }
};

// create the connection with postgres
const db = knex(config);
// expose the created connection, so we can
// use it in other files to make sql statements
module.exports = db;