const db = require('../../connectors/db');

module.exports = function (app) {
  //Register HTTP endpoint to render /index page
  app.get('/', function (req, res) {
    return res.render('index.html', { title: "Cairo Metro" });
  });

  // Register HTTP endpoint to render /login page
  app.get('/login', function (req, res) {
    return res.render('login.html', { title: "Login" });
  });
  // example of passing variables with a page
  app.get('/register', async function (req, res) {
    return res.render('register.html', { title: "Register" });
  });
};
