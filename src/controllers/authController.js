const User = require('../models/userModel');
const { generateToken } = require('../config/jwt');
const { validationResult } = require('express-validator');
const Faculty = require('../models/facultyModel');

// Student Registration
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation error', message: errors.array(), code: 400 });
    }
    const { name, email, matricule, faculty, program, phone, password } = req.body;
    const existing = await User.findOne({ $or: [{ email }, { matricule }] });
    if (existing) {
      return res.status(409).json({ error: 'Conflict', message: 'Email or matricule already exists', code: 409 });
    }
    // Validate faculty and program
    const facultyDoc = await Faculty.findOne({ code: faculty, 'programs.code': program });
    if (!facultyDoc) {
      return res.status(400).json({ error: 'Validation error', message: 'Invalid faculty or program', code: 400 });
    }
    const user = new User({
      name,
      email,
      matricule,
      faculty,
      program,
      phone,
      password,
      role: 'student',
      status: 'Active',
    });
    await user.save();
    const token = generateToken(user);
    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      matricule: user.matricule,
      role: user.role,
      faculty: user.faculty,
      program: user.program,
      status: user.status,
      createdDate: user.createdDate,
      token,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error', message: err.message, code: 500 });
  }
};

// Login (by email or matricule)
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation error', message: errors.array(), code: 400 });
    }
    const { identifier, password } = req.body;
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { matricule: identifier.toUpperCase() },
      ],
    }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials', code: 401 });
    }
    if (user.status !== 'Active') {
      return res.status(403).json({ error: 'Forbidden', message: 'Account inactive', code: 403 });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials', code: 401 });
    }
    const token = generateToken(user);
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      matricule: user.matricule,
      role: user.role,
      faculty: user.faculty,
      program: user.program,
      status: user.status,
      createdDate: user.createdDate,
      token,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error', message: err.message, code: 500 });
  }
};

// Admin-only user creation
exports.adminCreateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation error', message: errors.array(), code: 400 });
    }
    const { name, email, matricule, role, faculty, program, phone, password, status } = req.body;
    const allowedRoles = ['student', 'hod', 'coordinator', 'admin'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role', message: 'Role not allowed', code: 400 });
    }
    // Check for existing user
    const existingQuery = { email };
    if (matricule) existingQuery.$or = [{ email }, { matricule }];
    const existing = await User.findOne(existingQuery);
    if (existing) {
      return res.status(409).json({ error: 'Conflict', message: 'Email or matricule already exists', code: 409 });
    }
    // Role-specific validation
    if (role === 'student') {
      if (!matricule || !faculty || !program) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Matricule, faculty, and program required for student',
          code: 400,
        });
      }
      // Validate faculty and program
      const facultyDoc = await Faculty.findOne({ code: faculty, 'programs.code': program });
      if (!facultyDoc) {
        return res.status(400).json({ error: 'Validation error', message: 'Invalid faculty or program', code: 400 });
      }
    } else if (role === 'coordinator') {
      if (!faculty || program) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Faculty required and program not allowed for coordinator',
          code: 400,
        });
      }
      const facultyDoc = await Faculty.findOne({ code: faculty });
      if (!facultyDoc) {
        return res.status(400).json({ error: 'Validation error', message: 'Invalid faculty', code: 400 });
      }
    } else if (role === 'hod') {
      if (!faculty || !program) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Faculty and program required for HOD',
          code: 400,
        });
      }
      const facultyDoc = await Faculty.findOne({ code: faculty, 'programs.code': program });
      if (!facultyDoc) {
        return res.status(400).json({ error: 'Validation error', message: 'Invalid faculty or program', code: 400 });
      }
    } else if (role === 'admin') {
      if (faculty || program || matricule) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Faculty, program, and matricule not allowed for admin',
          code: 400,
        });
      }
    }
    const user = new User({
      name,
      email,
      matricule: role === 'student' ? matricule : undefined,
      role,
      faculty: ['student', 'coordinator', 'hod'].includes(role) ? faculty : undefined,
      program: ['student', 'hod'].includes(role) ? program : undefined,
      phone,
      password,
      status: status || 'Active',
      createdDate: new Date(),
    });
    await user.save();
    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      matricule: user.matricule,
      role: user.role,
      faculty: user.faculty,
      program: user.program,
      phone: user.phone,
      status: user.status,
      createdDate: user.createdDate,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error', message: err.message, code: 500 });
  }
};
