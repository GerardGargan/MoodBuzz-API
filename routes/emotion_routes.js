const express = require('express');
const controller = require('../controllers/emotion_controller');

const router = express.Router();

router.get('/', controller.getEmotions);

module.exports = router;