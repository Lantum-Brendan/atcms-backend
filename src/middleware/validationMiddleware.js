const { body, validationResult } = require('express-validator');

exports.validateComplaint = [
  body('name').notEmpty().withMessage('Name is required'),
  body('matricule').notEmpty().withMessage('Matricule is required'),
  body('level').isIn(['200', '300', '400', '500', '600', '700']).withMessage('Invalid level selected'),
  body('phoneNumber').optional().matches(/^\+?[1-9]\d{1,14}$/).withMessage('Invalid phone number'),
  body('complaintType').notEmpty().withMessage('Complaint type is required').isIn(['CA Mark', 'Exam Mark', 'Course Registration', 'Other']).withMessage('Invalid complaint type'),
  body('courseCode').notEmpty().withMessage('Course code is required'),
  body('subject').notEmpty().withMessage('Subject is required').isLength({ min: 5, max: 100 }).withMessage('Subject must be between 5 and 100 characters'),
  body('body').notEmpty().withMessage('Body is required').isLength({ min: 20, max: 1000 }).withMessage('Body must be between 20 and 1000 characters'),
  body('recipient').notEmpty().withMessage('Recipient is required').isIn(['HOD', 'Faculty Coordinator', 'Program Coordinator']).withMessage('Invalid recipient'),
  body('semester').isIn(['First Semester', 'Second Semester']).withMessage('Invalid semester selected'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input data',
        details: errors.array(),
        code: 400
      });
    }
    next();
  }
];