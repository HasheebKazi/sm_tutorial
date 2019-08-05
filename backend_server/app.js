const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const graphqlHttp = require('express-graphql');

const graphqlSchema = require('./graphql/schema');
const graphqlResolver = require('./graphql/resolvers');

const authController = require('./middleware/auth');

const app = express();

const imageFileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + '-' + path.extname(file.originalname));
    }
});

const imageFileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpg' || file.mimetype === 'image/png' || file.minetype === 'image/jpeg') {
        cb(null, true);
    } else {
        cb(null, false);
    }
}

// parse json data from requests
app.use(bodyParser.json());
app.use(multer({
    storage: imageFileStorage,
    fileFilter: imageFileFilter
}).single('image'));
app.use('/images', express.static(path.join(__dirname, 'images')));

// avoid cross origin resource sharing error
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// user authentication
app.use(authController);

app.put('/post-image', (req, res, next) => {
    if (!req.isAuth) {
        throw new Error('Not authenticated');
    }
    if(!req.file) {
        return res.status(200).json({ message: 'no file provided' });        
    }
    if (req.body.oldPath) {
        clearImage(req.body.oldPath);
    }
    return res.status(201).json({
        message: 'file stored',
        filePath: req.file.path
    });
});



app.use('/graphql', graphqlHttp({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true
}));

app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    return res.status(status).json({
        message: message,
        data: data
    });
});

const MONGODB_URI = require('./magic').MONGO_URI;
console.log(MONGODB_URI);

mongoose.connect(MONGODB_URI).then((result) => {
    const server = app.listen(8080);
}).catch((err) => {
    console.log(err)
})

const clearImage = (filePath) => {
    filePath = path.join(__dirname, filePath);
    fs.unlink(filePath, (err) => {
        console.log(err);
    })
}

