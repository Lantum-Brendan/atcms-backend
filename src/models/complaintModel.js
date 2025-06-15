//src/models/complaintModel.js
const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  matricule: {
    type: String,
    required: true,
    uppercase: true,
    index: true
  },
  program: {
    type: String,
    required: true,
    index: true
  },
  level: {
    type: String,
    required: true,
    enum: ['200', '300', '400', '500', '600', '700']
  },
  phoneNumber: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^\+?[1-9]\d{1,14}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  complaintType: {
    type: String,
    required: true,
    enum: ['CA Mark', 'Exam Mark', 'Course Registration', 'Other'],
    index: true
  },
  courseCode: {
    type: String,
    required: true,
    uppercase: true
  },
  subject: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  recipient: {
    type: String,
    required: true,
    enum: ['HOD', 'Faculty Coordinator', 'Program Coordinator']
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Resolved', 'Escalated'],
    default: 'Pending',
    index: true
  },
  semester: {
    type: String,
    required: true,
    enum: ['First Semester', 'Second Semester']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  statusHistory: [{
    status: {
      type: String,
      required: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    comment: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    text: {
      type: String,
      required: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  files: [{
    type: String // Store only filenames
  }],
  notifications: [{
    message: {
      type: String,
      required: true
    },
    read: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Update pre-save middleware to handle status changes
complaintSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (!this.statusHistory) {
      this.statusHistory = [];
    }
    if (!this._skipStatusHistory) {
      this.statusHistory.push({
        status: this.status,
        updatedBy: this._updatedBy || this.createdBy,
        timestamp: new Date()
      });
    }
  }
  next();
});

// Virtuals for additional computed properties
complaintSchema.virtual('isResolved').get(function() {
  return this.status === 'Resolved';
});

complaintSchema.virtual('daysOpen').get(function() {
  return Math.ceil((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

const Complaint = mongoose.model('Complaint', complaintSchema);
module.exports = Complaint;