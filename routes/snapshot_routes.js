const express = require('express');
const controller = require('../controllers/snapshot_controller');

const router = express.Router();

router.get('/user/:id', controller.getUserSnapshots);
router.get('/:id', controller.getSnapshot);
router.get('/analytics/snapshotspermonth/:id', controller.getSnapshotsPerMonth);
router.delete('/:id', controller.deleteSnapshot);
router.post('/', controller.processNewSnapshot);
router.patch('/edit/:id', controller.patchEditSnapshot);

module.exports = router;