const { validationResult } = require('express-validator/check');
const Post = require('../models/post');
const fs = require('fs');
const path = require('path');
const perPage = 2;

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
        // console.log('post creation route:', result);
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
        clearImage(post.imageUrl);
        return Post.findByIdAndRemove(postId);
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

