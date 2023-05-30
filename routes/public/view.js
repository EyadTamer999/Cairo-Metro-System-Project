const db = require('../../connectors/db');

module.exports = function(app) {
  //Register HTTP endpoint to render /index page
  app.get('/', function(req, res) {
    return res.render('index.html', {title: "Cairo Metro"});
  });

  // Register HTTP endpoint to render /login page
  app.get('/login', function(req, res) {
    return res.render('login.html', {title: "Cairo Metro"});
  });
// example of passing variables with a page
  app.get('/register', async function(req, res) {
    const stations = await db.select('*').from('se_project.stations');
    return res.render('register.html', { stations });
  });

  // example of passing variables with a page
  app.get('/dashboard', async function(req, res) {
    //Todo send user info via session to display things like name subscription etc. THIS SHOULD BE IN PRIVATE
    return res.render('dashboard.html',{firstName:"still not set"});
  });
};
