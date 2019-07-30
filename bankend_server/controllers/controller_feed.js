const { validationResult } = require('express-validator/check');
const Post = require('../models/post');
const fs = require('fs');
const path = require('path');
const perPage = 2;
const User = require('../models/user');

exports.getPosts = (req, res, next) => {
    const currentPage = req.query.page || 1;
    let totalItems;
    Post.find().count()
    .then(count => {
        totalItems = count;
        return Post.find()
        .skip((currentPage - 1)* perPage)
        .limit(perPage);
    })
    .then(posts => {
        if (!posts) {
            const error = new Error('No post found');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({
            message: 'fetch posts successfully',
            posts: posts,
            totalItems: totalItems
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
    const content = req.body.content;
    let creator;
    
    const post = new Post({
        title: title,
        content: content,
        creator: req.userId,
        imageUrl: imageUrl,

    })

    post.save().then(result => {
        
        return User.findById(req.userId);
    })
    .then(user => {

        creator = user;
        user.posts.push(post);
        return user.save();
    })
    .then(result => {
        console.log('post data', post);
        res.status(201).json({
            message: 'post created successfully',
            post: post,
            creator: {
                _id: creator._id, 
                name: creator.name
            }
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

exports.editPost = (req, res, next) => {

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        const err = new Error('Validation failed, provided information is not correct.');
        err.statusCode = 422;
        throw err;
    }
    
    const postId = req.params.postId;
    const editedTitle = req.body.title;
    const editedContent = req.body.content;
    let editedImageUrl = req.body.image;
    if (req.file) {
        editedImageUrl = req.file.path;
    }
    if (!editedImageUrl) {
        const error = new Error('No file picked');
        error.statusCode = 422;
        throw error
    }

    
    Post.findById(postId)
    .then(post => {
        if (!post) {
            const error = new Error('No post found');
            error.statusCode = 404;
            throw error;
        }

        if (req.userId !== post.creator.toString()) {
            const error = new Error('Not authroized');
            error.statusCode = 403;
            throw error;
        }

        if (post.imageUrl !== editedImageUrl) {
            clearImage(post.imageUrl)
        }
        post.title = editedTitle;
        post.content = editedContent;
        post.imageUrl = editedImageUrl;

        return post.save();
    })
    .then(result => {
        return res.status(200).json({
            message: "updated post",
            post: result
        })
    })
    .catch((err) => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
};

exports.deletePost = (req, res, next) => {
    const postId = req.params.postId;
  
    Post.findById(postId)
    .then(post => {
        // checked logged in user
        if (!post) {
            const error = new Error('No post found');
            error.statusCode = 404;
            throw error;
        }
        if (req.userId !== post.creator.toString()) {
            const error = new Error('Not authroized');
            error.statusCode = 403;
            throw error;
        }
        clearImage(post.imageUrl);
        return Post.findByIdAndRemove(postId);
    })
    .then(result => {
        return User.findById(req.userId);
    })
    .then(user => {
        user.posts.pull(postId);
        return user.save();
    })
    .then(result => {
        return res.status(200).json({
            message: "deleted post"
        })
    })
    .catch((err) => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
}

const clearImage = (filePath) => {
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, (err) => {
        console.log(err);
    })
}

