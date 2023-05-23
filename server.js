const path = require('path');
const express = require('express');
const app = express();
const authMiddleware = require('./middleware/auth');
const privateApiRoutes = require('./routes/private/api');
const publicApiRoutes = require('./routes/public/api');
const publicViewRoutes = require('./routes/public/view');
<<<<<<< HEAD
// const privateViewRoutes = require('./routes/private/views');
=======
const privateViewRoutes = require('./routes/private/view');

>>>>>>> 3d72db100e0683cb5e60d708f9ac3c348fa30244
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');
// Config setup to allow our HTTP server to serve static files from our public directory
app.use(express.static('public'));
// Config setup to parse JSON payloads from HTTP POST request body
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// All public routes can be accessible without authentication
<<<<<<< HEAD
publicViewRoutes(app);
=======

// uncomment to view frontend
// publicViewRoutes(app);
>>>>>>> 3d72db100e0683cb5e60d708f9ac3c348fa30244
publicApiRoutes(app);// uncomment

// If the request is not for a public view/api, then it must pass
// through our authentication middleware first
app.use(authMiddleware); // uncomment

// The routes/views below can only be accessed if the user is authenticated
<<<<<<< HEAD
privateViewRoutes(app);
=======

// uncomment to view frontend
// privateViewRoutes(app);
>>>>>>> 3d72db100e0683cb5e60d708f9ac3c348fa30244
privateApiRoutes(app);

// If request doesn't match any of the above routes then render the 404 page
app.use(function (req, res, next) {
    return res.status(404).render('404');
});

// Create HTTP Server and Listen for Requests
app.listen(3000);