const db = require('../../connectors/db');
const roles = require('../../constants/roles');
const { getSessionToken } = require('../../utils/session');

const getUser = async function(req) {
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

module.exports = function(app) {
  // Register HTTP endpoint to render /dashboard page
  app.get('/dashboard', async function(req, res) {
    const user = await getUser(req);
    return res.render('dashboard', user);
  });

  // Register HTTP endpoint to render /users page
  app.get('/users', async function(req, res) {
    const users = await db.select('*').from('se_project.users');
    return res.render('users', { users });
  });

  // Register HTTP endpoint to render /stations page
  app.get('/stations', async function(req, res) {
    const user = await getUser(req);
    const stations = await db.select('*').from('se_project.stations');
    return res.render('stations_example', { ...user, stations });
  });

  /*
  Comment date : 28/5/2023
  A list of things that I need to do to work on the frontend:
    1. I need to study the files and the examples and find out how to link the backend to the frontend correctly
    2. need to implement the basic html for part of my web page
    3. need to then style it.
    4. after completing these tasks I will try to help out my team with the rest.
  The deadline for completing the first two tasks is to do it before the weekend
  the third task needs to implemented within a week
  */
};