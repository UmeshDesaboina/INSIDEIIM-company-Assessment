const express = require('express');
const auth = require('../middleware/auth');
const { chat } = require('../controllers/chatController');

const router = express.Router();

router.use(auth);
router.post('/', chat);

module.exports = router;
