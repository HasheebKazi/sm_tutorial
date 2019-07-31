const express = require('express');
const { body } = require('express-validator/check')

const User = require('../models/user');
const authController = require('../controllers/controller_auth');

const router = express.Router();

// router.get('/posts', feedController.getPosts);
// router.post('/post', [
   
// ], feedController.createPost);

// router.get('/post/:postId', feedController.getPost);

// router.put('/post/:postId', [
//     body('title').trim().isLength({min:5}),
//     body('content').trim().isLength({min:5}),    
// ], feedController.editPost);

// router.delete('/post/:postId', feedController.deletePost);

router.put('/signup', [
    body('email')
        .isEmail()
        .withMessage('Please enter a valid email.')
        .custom((value, { req }) => {
            return User.findOne({ email: value }).then(userDoc => {
                if (userDoc) {
                    return Promise.reject('Email address already exits.');
                }
            })
        })
        .normalizeEmail(),
    body('password')
        .trim().isLength({min:5}), 
    body('name')
        .trim()
        .not()
        .isEmpty()
], authController.signup);

router.post('/login', authController.postLogin);

module.exports = router;