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
        if (user.isAdmin){
            return res.render('manage.html', {user});
        }
    
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

    // Register HTTP endpoint to render /stations page
    app.get('/stations', async function (req, res) {
        const user = await getUser(req);
        const stations = await db.select('*').from('se_project.stations');
        return res.render('stations.html', {...user, stations});
    });

        // Register HTTP endpoint to render /edit stations page
        app.get('/manage/stations/edit/:stationId', async function (req, res) {
            const user = await getUser(req);
            const stations = await db.select('*').from('se_project.stations');
            return res.render('edit.html', {...user, stations});
        });

        
    // Register HTTP endpoint to render /routes page
    app.get('/routes', async function (req, res) {
        const user = await getUser(req);
        const routes = await db.select('*').from('se_project.routes');
        return res.render('routes.html', {...user, routes});
    });

        // Register HTTP endpoint to render /edit routes page
        app.get('/manage/routes/edit/:routeId', async function (req, res) {
            const user = await getUser(req);
            const routes = await db.select('*').from('se_project.routes');
            return res.render('edit.html', {...user, routes});
        });

            // Register HTTP endpoint to render /zones page
    app.get('/zones', async function (req, res) {
        const user = await getUser(req);
        const zones = await db.select('*').from('se_project.zones');
        return res.render('zones.html', {...user, zones});
    });

        // Register HTTP endpoint to render /edit zones page
        app.get('/manage/zones/edit/zoneId', async function (req, res) {
            const user = await getUser(req);
            const zones = await db.select('*').from('se_project.zones');
            return res.render('edit.html', {...user, zones});
        });

};