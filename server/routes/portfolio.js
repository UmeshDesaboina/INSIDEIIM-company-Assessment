const express = require('express');
const auth = require('../middleware/auth');
const { getPortfolio, addHolding, updateHolding, deleteHolding } = require('../controllers/portfolioController');

const router = express.Router();

router.use(auth);
router.get('/', getPortfolio);
router.post('/holdings', addHolding);
router.put('/holdings/:symbol', updateHolding);
router.delete('/holdings/:symbol', deleteHolding);

module.exports = router;
