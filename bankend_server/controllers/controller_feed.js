const { validationResult } = require('express-validator/check');

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
    // console.log('title:', title);
    console.log(req.body);

    const content = req.body.content
    // create post in databse;
    res.status(201).json({
        message: 'post created successfully',
        post: {
            _id: new Date().toISOString(),
            title: title,
            content: content,
            creator: {
                name: 'pooper'
            }, 
            createdAt: new Date()
        }
    })
};