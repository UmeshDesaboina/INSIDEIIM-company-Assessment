const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const { searchLimiter } = require('../middleware/rateLimiter');
const { searchCompany, generateReport, getReport, getReportPDF, toggleSaveReport, getSavedReports } = require('../controllers/reportController');

const router = express.Router();

router.use(auth);

router.get('/search', searchCompany);
router.post('/generate', searchLimiter, [
  body('symbol').trim().notEmpty().withMessage('Stock symbol required')
], validate, generateReport);
router.get('/saved', getSavedReports);
router.get('/pdf/:symbol', getReportPDF);
router.get('/:symbol', getReport);
router.patch('/:symbol/save', toggleSaveReport);

module.exports = router;
