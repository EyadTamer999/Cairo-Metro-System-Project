const db = require('../../connectors/db');
const roles = require('../../constants/roles');
const {getSessionToken} = require('../../utils/session');

const getUser = async function (req) {
    const sessionToken = getSessionToken(req);
    if (!sessionToken) {
        return res.status(301).redirect('/');
    }

    const user = await db.select('*')
        .from('se_project.sessions')
        .where('token', sessionToken)
        .innerJoin('se_project.users', 'se_project.sessions.userid', 'se_project.users.id')
        .innerJoin('se_project.roles', 'se_project.users.roleid', 'se_project.roles.id')
        .first();

    console.log('user =>', user)
    user.isNormal = user.roleid === roles.user;
    user.isAdmin = user.roleid === roles.admin;
    user.isSenior = user.roleid === roles.senior;

    return user;
}

module.exports = function (app) {
    // Register HTTP endpoint to render /users page
    app.get('/dashboard', async function (req, res) {
        const user = await getUser(req);
        const userRides =  await db.select('*').from("se_project.rides").where('userid',user['userid'])
        const stations = await db.select('*').from('se_project.stations');
        const userSubscription =  await db.select('*').from("se_project.subscription").where('userid',user['userid'])
        const purchaseHistory = await db.select('*').from("se_project.transactions").where('userid',user['userid'])
        console.log(purchaseHistory)
        return res.render('dashboard.html', {user, userRides , userSubscription, stations, purchaseHistory});
    });

    // Register HTTP endpoint to render /users page
    app.get('/users', async function (req, res) {
        const users = await db.select('*').from('se_project.users');
        return res.render('users.html', {users});
    });

    // Register HTTP endpoint to render /courses page
    app.get('/stations_example', async function (req, res) {
        const user = await getUser(req);
        const stations = await db.select('*').from('se_project.stations');
        return res.render('stations_example.html', {...user, stations});
    });


};