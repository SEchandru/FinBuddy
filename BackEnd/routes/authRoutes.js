const express = require('express');
const router = express.Router();
const authController = require('../contollers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', authMiddleware, authController.getProfile);
router.post('/onboard', authMiddleware, authController.onboard);
router.put('/profile', authMiddleware, authController.updateProfile);

module.exports = router;
