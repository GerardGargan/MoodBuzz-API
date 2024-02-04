const express = require('express');
const controller = require('./../controllers/controller');

const router = express.Router();

router.get('/snapshot/:id', controller.getSnapshot);

module.exports = router;