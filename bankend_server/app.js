const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

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
const MONGODB_URI = 'mongodb+srv://node_project:AkWcOzQBkbWJdXoA@summer-2019-fo8l7.mongodb.net/messages';

mongoose.connect(MONGODB_URI).then((result) => {
    app.listen(8080);
}).catch((err) => {
    console.log(err)
})

