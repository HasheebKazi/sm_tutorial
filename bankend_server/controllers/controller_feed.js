const { validationResult } = require('express-validator/check');
const Post = require('../models/post');
const mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

exports.getPosts = (req, res, next) => {

    Post.find()
    .then(posts => {
        if (!posts) {
            const error = new Error('No post found');
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({
            message: 'fetch posts successfully',
            posts: posts
        });
    })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
};

exports.createPost = (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        const err = new Error('Validation failed, provided information is not correct.');
        err.statusCode = 422;
        throw err;
    }
    if (!req.file) {
        const error = new Error('No image provided');
        error.statusCode = 422;
        throw error;
    }

    const imageUrl = req.file.path;
    const title = req.body.title;
    const content = req.body.content
    
    const post = new Post({
        title: title,
        content: content,
        creator: {
            name: 'pooper'
        },
        imageUrl: imageUrl
    })

    post.save().then(result => {
        console.log('post creation route:', result);
        res.status(201).json({
            message: 'post created successfully',
            post: post
        })
    }).catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    })
};

exports.getPost = (req, res, next) => {
    const postId = req.params.postId;
    console.log('sdfasdfdsfdsf', postId);
    Post.findById(postId)
    .then(post => {
        if (!post) {
            const error = new Error('No post found');
            error.statusCode = 404;
            throw error;
        }
        return res.status(200).json({
            message: 'success',
            post: post
        })
    })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
}