const { validationResult } = require('express-validator/check');
const User = require('../models/user');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jsonWebToken = require('jsonwebtoken');
const { secretKey } = require('../magic');

exports.signup = (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        const err = new Error('Validation Failed.');
        err.statusCode = 422;
        err.data = errors.array();
        throw err;
    }

    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;
    bcrypt.hash(password, 12)
        .then(hashedPw => {
            const user = new User({
                email: email,
                password: hashedPw,
                name: name
            });
            return user.save();
        })
        .then(result => {
            return res.status(201).json({
                message: 'User Created',
                userId: result._id
            })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });

};

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    let loadedUser;
    User.findOne({
        email: email
    })
    .then(user => {
        if (!user) {
            const error = new Error('No user found');
            error.statusCode = 401;
            throw error;
        }
        loadedUser= user;
        return bcrypt.compare(password, user.password);
    })
    .then(isEqual => {
        if (!isEqual) {
            const error = new Error('Incorrect email or passowrd');
            error.statusCode = 401;
            throw error;
        }
        const token = jsonWebToken.sign({
            email: email,
            userId: loadedUser._id.toString()
        }, secretKey, { expiresIn: '1h'});
        return res.status(200).json({
            message: 'successful login',
            token: token
        })
    })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    })
}