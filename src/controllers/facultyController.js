const Faculty = require('../models/facultyModel');

// Get all faculties with their programs
exports.getFaculties = async (req, res) => {
  try {
    const faculties = await Faculty.find().select('name code programs');
    res.status(200).json(faculties);
  } catch (err) {
    res.status(500).json({ error: 'Server error', message: err.message, code: 500 });
  }
};