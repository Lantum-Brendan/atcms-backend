const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const roles = {
  STUDENT: 'student',
  HOD: 'hod',
  COORDINATOR: 'coordinator',
  ADMIN: 'admin',
};

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  matricule: { 
    type: String, 
    required: function() {
      return this.role === roles.STUDENT;
    }, 
    sparse: true, // Allow multiple null values
    unique: true,
    index: { unique: true, sparse: true }, // Add sparse index option
    uppercase: true, 
    trim: true 
  },
  role: { type: String, enum: Object.values(roles), default: roles.STUDENT },
  faculty: { type: String },
  program: { 
    type: String,
    required: function() {
      return [roles.STUDENT, roles.HOD].includes(this.role);
    }
  },
  programs: {
    type: [String],
    validate: {
      validator: function(v) {
        // Only require programs for coordinators
        return this.role !== roles.COORDINATOR || (Array.isArray(v) && v.length > 0);
      },
      message: 'Coordinator must have at least one program assigned'
    }
  },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  createdDate: { type: Date, default: Date.now },
  password: { type: String, required: true, select: false },
  phone: { type: String },
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Password comparison method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;