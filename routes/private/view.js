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
        .innerJoin('se_project.users', 'se_project.sessions.userId', 'se_project.users.id')
        .innerJoin('se_project.roles', 'se_project.users.roleId', 'se_project.roles.id')
        .first();

    console.log('user =>', user)
    user.isStudent = user.roleId === roles.student;
    user.isAdmin = user.roleId === roles.admin;
    user.isSenior = user.roleId === roles.senior;

    return user;
}

module.exports = function (app) {
    // Register HTTP endpoint to render /users page
    app.get('/dashboard', async function (req, res) {
        const user = await getUser(req);
        return res.render('dashboard', user);
    });

    // Register HTTP endpoint to render /users page
    app.get('/users', async function (req, res) {
        const users = await db.select('*').from('se_project.users');
        return res.render('users', {users});
    });

    // Register HTTP endpoint to render /courses page
    app.get('/stations', async function (req, res) {
        const user = await getUser(req);
        const stations = await db.select('*').from('se_project.stations');
        return res.render('stations_example', {...user, stations});
    });

};