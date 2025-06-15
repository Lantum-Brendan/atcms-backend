const express = require('express');
const { getFaculties } = require('../controllers/facultyController');
const catchAsync = require('../utils/catchAsync');

const router = express.Router();

router.get('/', catchAsync(getFaculties));

module.exports = router;