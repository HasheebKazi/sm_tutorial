const bcrypt = require('bcryptjs');
const User = require('../models/user');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const { secretKey } = require('../magic');

const Post = require('../models/post')


module.exports = {
    createUser: async function({ userInput }, req) {
        // user validation
        const errors = []
        if (!validator.isEmail(userInput.email)) {
            errors.push({ message: 'Email is invalid.'});
        }
        if (validator.isEmpty(userInput.password) || !validator.isLength(userInput.password, { min: 5})) {
            errors.push({ message: 'Password is invalid.'});
        }
        if (errors.length > 0) {
            const error = new Error('Invalid Input');
            throw error;
        }

        const existingUser = await User.findOne({email: userInput.email});
        if (existingUser) {
            const error = new Error("User exits already.")
            throw error;
        }
        const hashedPw = await bcrypt.hash(userInput.password, 12);
        const user = new User({
            email: userInput.email,
            name: userInput.name,
            password: hashedPw
        });

        const createdUser = await user.save();
        return { ...createdUser._doc, _id: createdUser._id.toString() }
    },
    login: async function({ email, password }) {
        const user = await User.findOne({email: email});
        if (!user) {
            const error = new Error('User not found.');
            error.code = 401;
            throw error;
        }
        const isEqual = await bcrypt.compare(password, user.password);
        if (!isEqual) {
            const error = new Error('Login info incorrect.');
            error.code = 401;
            throw error;
        }
        const token = jwt.sign({
            userId: user._id.toString(),
            email: user.email
        }, secretKey, {expiresIn: '1h'});

        return { token: token, userId: user._id.toString() };

    },

    createPost: async function({ postInput }, req) {

        if(!req.isAuth) {
            const error = new Error('User not authenticated');
            error.code = 422;
            throw error;
        }
        // user validation
        const errors = []
        if (validator.isEmpty(postInput.title) || !validator.isLength(postInput.title, { min: 5 })) {
            errors.push({ message: 'Title is invalid.'});
        }
        if (validator.isEmpty(postInput.content) || !validator.isLength(postInput.content, { min: 5})) {
            errors.push({ message: 'Content is invalid.'});
        }
        if (errors.length > 0) {
            const error = new Error('Invalid Input');
            error.data = errors;
            error.code = 422;
            throw error;
        }

        const user = await User.findById(req.userId);
        if (!user) {
            const error = new Error('Invalid User');
            error.code = 401;
            throw error;
        }

        const post = new Post({
            title: postInput.title,
            content: postInput.content,
            imageUrl: postInput.imageUrl,
            creator: user
        });

        const createdPost = await post.save();
        user.posts.push(createdPost);
        await user.save();

        
        return {
            ...createdPost._doc,
            _id: createdPost._id.toString(),
            createdAt: createdPost.createdAt.toISOString(),
            updatedAt: createdPost.updatedAt.toISOString()
        }

    },

    posts: async function({page}, req) {
        if(!req.isAuth) {
            const error = new Error('User not authenticated');
            error.code = 422;
            throw error;
        }
        if (!page) {
            page = 1;
        }

        const perPage = 2;


        const totalPosts = await Post.find().countDocuments();
        const posts = await Post.find().sort({ createdAt: -1 }).skip((page - 1)*perPage).limit(perPage).populate('creator');

        return {
            posts: posts.map(p => {
                return {
                    ...p._doc,
                    _id: p._id.toString(),
                    createdAt: p.createdAt.toISOString(),
                    updatedAt: p.updatedAt.toISOString()
                }
            }),
            totalPosts: totalPosts
        }
    },

    post: async function({ id }, req) {
        if(!req.isAuth) {
            const error = new Error('User not authenticated');
            error.code = 422;
            throw error;
        }

        const post = await Post.findById(id).populate('creator');
        if (!post) {
            const error = new Error('No post found.');
            error.code = 401;
            throw error;
        }

        // console.log(post);
        return {
            ...post._doc,
            id: post._id.toString(),
            createdAt: post.createdAt.toISOString(),
            updatedAt: post.updatedAt.toISOString()
        }
    },

    updatePost: async function({id, postInput}, req) {
        if(!req.isAuth) {
            const error = new Error('User not authenticated');
            error.code = 422;
            throw error;
        }

        const post = await Post.findById(id).populate('creator');

        if (!post) {
            const error = new Error('No post found.');
            error.code = 401;
            throw error;
        }

        if (post.creator._id.toString() !== req.userId.toString()) {
            const error = new Error('Authentication Error.');
            error.code = 403;
            throw error;
        }

        const errors = []
        if (!validator.isEmail(userInput.email)) {
            errors.push({ message: 'Email is invalid.'});
        }
        if (validator.isEmpty(userInput.password) || !validator.isLength(userInput.password, { min: 5})) {
            errors.push({ message: 'Password is invalid.'});
        }
        if (errors.length > 0) {
            const error = new Error('Invalid Input');
            error.data = errors;
            error.code = 422;
            throw error;
        }

        post.title = postInput.title;
        post.content = postInput.content;
        if(postInput.imageUrl !== 'undefined') {
            post.imageUrl = postInput.imageUrl;
        }

        const updatePost = await post.save();

        return {
            ...updatedPost._doc,
            id: updatedPost._id.toString(),
            createdAt: updatedPost.createdAt.toISOString(),
            updatedAt: updatedPost.updatedAt.toISOString()
        };
    }
};