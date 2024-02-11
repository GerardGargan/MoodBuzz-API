const express = require('express');
const controller = require('../controllers/trigger_controller');

const router = express.Router();

router.get('/', controller.getTriggers);

module.exports = router;