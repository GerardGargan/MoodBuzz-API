const express = require('express');
const controller = require('./../controllers/controller');

const router = express.Router();

router.get('/snapshot/:id', controller.getSnapshot);
router.delete('/snapshot/:id', controller.deleteSnapshot);

module.exports = router;