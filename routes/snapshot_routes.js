const express = require('express');
const controller = require('../controllers/snapshot_controller');

const router = express.Router();

router.get('/:id', controller.getSnapshot);
router.delete('/:id', controller.deleteSnapshot);

module.exports = router;