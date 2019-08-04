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

        const post = new Post({
            title: postInput.title,
            content: postInput.content,
            imageUrl: postInput.imageUrl
        });

        const createdPost = await post.save();
        
        
        return {
            ...createdPost._doc,
            _id: createdPost._id.toString(),
            createdAt: createdPost.createdAt.toISOString(),
            updatedAt: createdPost.updatedAt.toISOString()
        }

    }
};