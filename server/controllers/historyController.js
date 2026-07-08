const History = require('../models/History');

const getHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [history, total] = await Promise.all([
      History.find({ user: req.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      History.countDocuments({ user: req.userId })
    ]);

    res.json({
      history,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get history' });
  }
};

const clearHistory = async (req, res) => {
  try {
    await History.deleteMany({ user: req.userId });
    res.json({ message: 'History cleared' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to clear history' });
  }
};

module.exports = { getHistory, clearHistory };
