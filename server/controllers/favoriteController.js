const Favorite = require('../models/Favorite');

const getFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.userId })
      .sort({ createdAt: -1 });
    res.json({ favorites });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get favorites' });
  }
};

const addFavorite = async (req, res) => {
  try {
    const { symbol, companyName } = req.body;
    if (!symbol || !companyName) {
      return res.status(400).json({ message: 'Symbol and company name are required' });
    }

    const existing = await Favorite.findOne({ user: req.userId, symbol: symbol.toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: 'Already in favorites' });
    }

    const favorite = await Favorite.create({
      user: req.userId,
      symbol: symbol.toUpperCase(),
      companyName
    });

    res.status(201).json({ favorite });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Already in favorites' });
    }
    res.status(500).json({ message: 'Failed to add favorite' });
  }
};

const removeFavorite = async (req, res) => {
  try {
    const { symbol } = req.params;
    const result = await Favorite.findOneAndDelete({
      user: req.userId,
      symbol: symbol.toUpperCase()
    });

    if (!result) {
      return res.status(404).json({ message: 'Favorite not found' });
    }

    res.json({ message: 'Removed from favorites' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove favorite' });
  }
};

module.exports = { getFavorites, addFavorite, removeFavorite };
