const express = require('express');
const controller = require('../controllers/user_controller');

const router = express.Router();

router.get('/:id', controller.getUser);

module.exports = router;