const express = require('express');
const bodyParser = require('body-parser');

const feed_routes = require('./routes/routes_feed');

const app = express();

// parse json data from requests
app.use(bodyParser.json());

// avoid cross origin resource sharing error
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});


app.use('/feed', feed_routes);

app.listen(8080);