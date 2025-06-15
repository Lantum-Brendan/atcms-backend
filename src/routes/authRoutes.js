const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const catchAsync = require('../utils/catchAsync');
const Faculty = require('../models/facultyModel');

const router = express.Router();

// Registration validation
const registerValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('matricule').notEmpty().withMessage('Matricule is required'),
  body('faculty').notEmpty().withMessage('Faculty is required').custom(async (value) => {
    const faculty = await Faculty.findOne({ code: value });
    if (!faculty) throw new Error('Invalid faculty');
    return true;
  }),
  body('program').notEmpty().withMessage('Program is required').custom(async (value, { req }) => {
    const faculty = await Faculty.findOne({ code: req.body.faculty });
    if (!faculty || !faculty.programs.some(p => p.code === value)) {
      throw new Error('Invalid program for selected faculty');
    }
    return true;
  }),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

// Login validation
const loginValidation = [
  body('identifier').notEmpty().withMessage('Email or matricule is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Admin user creation validation
const adminCreateUserValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('matricule').notEmpty().withMessage('Matricule is required'),
  body('role').notEmpty().withMessage('Role is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('faculty').optional().custom(async (value) => {
    if (!value) return true;
    const faculty = await Faculty.findOne({ code: value });
    if (!faculty) throw new Error('Invalid faculty');
    return true;
  }),
  body('program').optional().custom(async (value, { req }) => {
    if (!value) return true;
    const faculty = await Faculty.findOne({ code: req.body.faculty });
    if (!faculty || !faculty.programs.some(p => p.code === value)) {
      throw new Error('Invalid program for selected faculty');
    }
    return true;
  }),
];

// Public routes
router.post('/register', registerValidation, catchAsync(authController.register));
router.post('/login', loginValidation, catchAsync(authController.login));

// Protected routes
router.post(
  '/admin/users',
  protect,
  restrictTo(['admin']),
  adminCreateUserValidation,
  catchAsync(authController.adminCreateUser)
);

module.exports = router;