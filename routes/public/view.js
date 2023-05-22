
const db = require('../../connectors/db');

module.exports = function(app) {
  //Register HTTP endpoint to render /index page
  app.get('/', function(req, res) {
    return res.render('index', {title: "Cairo Metro"});
  });
// example of passing variables with a page
  app.get('/register', async function(req, res) {
    const stations = await db.select('*').from('se_project.stations');
    return res.render('register', { stations });
  });

  // example of passing variables with a page
  app.get('/dashboard', async function(req, res) {
    //Todo send user info via session to display things like name subscription etc.
    return res.render('dashboard',{firstName:"still not set"});
  });
};
