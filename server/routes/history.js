const express = require('express');
const auth = require('../middleware/auth');
const { getHistory, clearHistory } = require('../controllers/historyController');

const router = express.Router();

router.use(auth);
router.get('/', getHistory);
router.delete('/', clearHistory);

module.exports = router;
