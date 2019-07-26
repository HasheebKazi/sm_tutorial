const { validationResult } = require('express-validator/check');
const Post = require('../models/post');

exports.getPosts = (req, res, next) => {
    res.status(200).json({
        posts: [{
            _id: '2',
            title: 'First Post',
            content: 'This is the first post!',
            imageUrl: 'images/logo_2.jpg',
            creator: {
                name: 'Dogger'
            }, 
            createdAt: new Date()
        }]
    });
};

exports.createPost = (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        res.status(422).json({
            message: 'validation failed',
            errors: errors.array()
        })
    }


    const title = req.body.title;
    const content = req.body.content
    
    const post = new Post({
        title: title,
        content: content,
        creator: {
            name: 'pooper'
        },
        imageUrl: 'images/duck'
    })
    post.save().then(result => {
        console.log('post creation route:', result);
        res.status(201).json({
            message: 'post created successfully',
            post: post
        })
    }).catch(err => {
        console.log(err)
    })
};