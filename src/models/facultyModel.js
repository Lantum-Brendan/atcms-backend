const mongoose = require('mongoose');

const programSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
  }
}, { _id: false });

const facultySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  programs: [programSchema]
});

// Compound index to ensure program codes are unique within a faculty
facultySchema.index({ 'programs.code': 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Faculty', facultySchema);