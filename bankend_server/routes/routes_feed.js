const express = require('express');
const { body } = require('express-validator/check');
const authMiddleware = require('../middleware/isauth');

const feedController = require('../controllers/controller_feed');

const router = express.Router();

router.get('/posts', authMiddleware, feedController.getPosts);

router.post('/post', authMiddleware, [
    body('title').trim().isLength({min:5}),
    body('content').trim().isLength({min:5}),    
], feedController.createPost);

router.get('/post/:postId', authMiddleware, feedController.getPost);

router.put('/post/:postId', authMiddleware, [
    body('title').trim().isLength({min:5}),
    body('content').trim().isLength({min:5}),    
], feedController.editPost);

router.delete('/post/:postId', authMiddleware, feedController.deletePost);

module.exports = router;