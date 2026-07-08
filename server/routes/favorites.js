const express = require('express');
const auth = require('../middleware/auth');
const { getFavorites, addFavorite, removeFavorite } = require('../controllers/favoriteController');

const router = express.Router();

router.use(auth);
router.get('/', getFavorites);
router.post('/', addFavorite);
router.delete('/:symbol', removeFavorite);

module.exports = router;
