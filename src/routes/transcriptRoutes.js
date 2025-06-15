// routes/transcriptRoutes.js

const express = require('express');
const router = express.Router();
const transcriptController = require('../controllers/transcriptController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const catchAsync = require('../utils/catchAsync');
const { body } = require('express-validator');

// Validation middleware
const validateTranscriptRequest = [
  body('level')
    .matches(/^L[2-7]00$/)
    .withMessage('Level must be between L200 and L700'),
  body('faculty')
    .notEmpty()
    .withMessage('Faculty is required'),
  body('program')
    .notEmpty()
    .withMessage('Program is required'),
  body('semester')
    .isIn(['First', 'Second'])
    .withMessage('Invalid semester'),
  body('modeOfTreatment')
    .isIn(['Super Fast', 'Fast', 'Normal', 'Verification'])
    .withMessage('Invalid mode of treatment'),
  body('numberOfCopies')
    .isInt({ min: 1 })
    .withMessage('Number of copies must be at least 1'),
  body('verifierEmail')
    .if(body('modeOfTreatment').equals('Verification'))
    .isEmail()
    .withMessage('Valid verifier email is required for verification mode'),
  body('paymentDetails.provider')
    .isIn(['MTN', 'Orange', 'YooMee'])
    .withMessage('Invalid payment provider'),
  body('paymentDetails.phoneNumber')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number format')
];

// Protect all routes
router.use(protect);

// Student route: request a transcript
router.post(
  '/request',
  restrictTo('student'),          // <-- use string, not array
  validateTranscriptRequest,
  catchAsync(transcriptController.createTranscriptRequest)
);

// Get student's transcripts
router.get(
  '/student/:matricule',
  catchAsync(transcriptController.getStudentTranscripts)
);

// Get a single transcript by ID
router.get(
  '/:id',
  catchAsync(transcriptController.getTranscriptById)
);

// Download transcript PDF
router.get(
  '/:id/download',
  catchAsync(transcriptController.downloadTranscript)
);

// Admin routes
router.get(
  '/',
  restrictTo('admin'),            // <-- use string
  catchAsync(transcriptController.getAllTranscripts)
);

router.patch(
  '/:id/status',
  restrictTo('admin'),            // <-- use string
  body('status')
    .isIn(['Processing', 'Completed', 'Failed'])
    .withMessage('Invalid status'),
  catchAsync(transcriptController.updateTranscriptStatus)
);

router.get(
  '/statistics',
  restrictTo('admin'),
  catchAsync(transcriptController.getStatistics)
);

// Mark transcript complete (admin)
router.patch(
  '/:id/complete',
  restrictTo('admin'),
  transcriptController.markTranscriptComplete
);

// Create verification request (student)
router.post(
  '/:id/verify',
  restrictTo('student'),
  catchAsync(transcriptController.createVerificationRequest)
);

module.exports = router;
