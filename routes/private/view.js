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
        app.get('/manage/zones/edit/:zoneId', async function (req, res) {
            const user = await getUser(req);
            const zones = await db.select('*').from('se_project.zones');
            return res.render('edit.html', {...user, zones});
        });


      // Register HTTP endpoint to render /requests page
    app.get('/requests', async function (req, res) {
        const user = await getUser(req);
        return res.render('requests.html', {...user});
    });

        // Register HTTP endpoint to render /senior requests page
        app.get('/manage/requests/seniors', async function (req, res) {
            const user = await getUser(req);
            const seniors = await db.select('*').from('se_project.senior_requests');
            return res.render('seniors.html', {...user, seniors});
        });


        
        // Register HTTP endpoint to render /senior requests page
        app.get('/manage/requests/refunds', async function (req, res) {
            const user = await getUser(req);
            const refunds = await db.select('*').from('se_project.refund_requests');
            return res.render('refunds.html', {...user, refunds});
        });


            // Register HTTP endpoint to render /subscriptions page
            app.get('/subscriptions', async function (req, res) {
                const user = await getUser(req);
                const zones = await db.select('*').from('se_project.zones');
                return res.render('subscriptions.html', { ...user, zones });
            });

        // Register HTTP endpoint to render /tickets page
        app.get('/tickets', async function (req, res) {
            const user = await getUser(req);
            const tickets = await db.select('*').from('se_project.tickets').where({ userid: user.userid });
            // console.log(JSON.stringify(user)); 
            // console.log(tickets);
            return res.render('tickets.html', { ...user, tickets });
        });


                // Register HTTP endpoint to render /tickets page
                app.get('/tickets/purchase', async function (req, res) {
                    const user = await getUser(req);
                   // const tickets = await db.select('*').from('se_project.tickets').where({ userid: user.userid });
                    // console.log(JSON.stringify(user)); 
                    // console.log(tickets);
                    return res.render('purchase.html', { ...user });
                });

                app.get('/rides', async (req, res) =>{
                    const user = await getUser(req);
                    const rides = await db("se_project.rides").select("*").where({userid : user.userid});
                    return res.render('rides.html',{...user,rides});
                });

                app.get('/rides/simulate', async (req, res) =>{
                    const user = await getUser(req);
                     const rides = await db("se_project.rides").select("*").where({userid : user.userid});
                    return res.render('simulate.html',{...user, rides});
                });

                app.get('/prices', async (req, res) =>{
                    const user = await getUser(req);
                     const tickets = await db("se_project.tickets").select("*").where({userid : user.userid});
                    return res.render('prices.html',{...user, tickets});
                });
};