//src/controllers/complaintController.js
const Complaint = require('../models/complaintModel');
const catchAsync = require('../utils/catchAsync');
const logger = require('../utils/logger');
const User = require('../models/userModel');
const { deleteFiles } = require('../middleware/uploadMiddleware');


// Create complaint
exports.createComplaint = catchAsync(async (req, res) => {
    const { name, matricule, level, phoneNumber, complaintType, courseCode, subject, body, recipient, semester } = req.body;

    if (req.user.role !== 'student') {
      return res.status(403).json({
        status: 'error',
        message: 'Only students can create complaints'
      });
    }

    const files = req.files ? req.files.map(file => file.filename) : [];

    const complaint = await Complaint.create({
      name,
      matricule,
      program: req.user.program, // Derive from user
      level,
      phoneNumber,
      complaintType,
      courseCode,
      subject,
      body,
      recipient,
      semester: semester || 'First Semester', // Default if not provided
      status: 'Pending',
      createdBy: req.user._id,
      files
    });

    complaint.notifications = [{
      message: `New complaint created by ${req.user.name}`
    }];
    await complaint.save();

    res.status(201).json({
      status: 'success',
      data: complaint
    });
});

// Get all complaints
exports.getAllComplaints = catchAsync(async (req, res) => {
    let query = {};
    if (req.user.role === 'student') {
      query.createdBy = req.user._id;
    } else if (req.user.role === 'hod') {
      query.program = req.user.program;
    } else if (req.user.role === 'coordinator') {
      query.program = { $in: req.user.programs };
    }

    const complaints = await Complaint.find(query)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort('-createdAt');

    const formattedComplaints = complaints.map(complaint => ({
      id: complaint._id,
      name: complaint.name,
      matricule: complaint.matricule,
      level: complaint.level,
      phoneNumber: complaint.phoneNumber,
      subject: complaint.subject,
      body: complaint.body,
      recipient: complaint.recipient,
      status: complaint.status,
      files: complaint.files,
      date: complaint.createdAt
    }));

    res.status(200).json({
      status: 'success',
      data: formattedComplaints
    });
});

// Get complaint by ID
exports.getComplaintById = catchAsync(async (req, res) => {
    const complaint = await Complaint.findById(req.params.id)
        .populate('createdBy', 'name email')
        .populate('assignedTo', 'name email')
        .populate('statusHistory.updatedBy', 'name email')
        .populate('comments.author', 'name email');

    if (!complaint) {
        return res.status(404).json({
            status: 'error',
            message: 'Complaint not found'
        });
    }

    res.status(200).json({
        status: 'success',
        data: complaint
    });
});

// Update complaint status
exports.updateStatus = catchAsync(async (req, res) => {
    const { status, comment } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
        return res.status(404).json({
            status: 'error',
            message: 'Complaint not found'
        });
    }

    // Set flag to skip automatic status history in pre-save middleware
    complaint._skipStatusHistory = true;
    
    // Clear existing status history and set new status
    complaint.statusHistory = [{
        status,
        updatedBy: req.user._id,
        comment,
        timestamp: new Date()
    }];
    
    complaint.status = status;

    // Add notification
    complaint.notifications.push({
        message: `Status updated to ${status}`
    });

    await complaint.save();

    res.status(200).json({
        status: 'success',
        data: complaint
    });
});

// Add comment
exports.addComment = catchAsync(async (req, res) => {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
        return res.status(404).json({
            status: 'error',
            message: 'Complaint not found'
        });
    }

    complaint.comments.push({
        text: req.body.comment,
        author: req.user._id
    });

    complaint.notifications.push({
        message: `New comment added by ${req.user.name}`
    });

    await complaint.save();

    res.status(200).json({
        status: 'success',
        data: complaint
    });
});

// Escalate complaint
exports.escalateComplaint = catchAsync(async (req, res) => {
    const { instructions } = req.body;
    
    // Find admin user
    const admin = await User.findOne({ role: 'admin' });
  
    if (!admin) {
        // Cleanup uploaded files if admin not found
        if (req.files?.length) {
            const filePaths = req.files.map(file => file.path);
            await deleteFiles(filePaths);
        }
      
        return res.status(500).json({
            status: 'error',
            message: 'Escalation failed: No admin user found'
        });
    }
  
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
        // Cleanup uploaded files if complaint not found
        if (req.files?.length) {
            const filePaths = req.files.map(file => file.path);
            await deleteFiles(filePaths);
        }
      
        return res.status(404).json({
            status: 'error',
            message: 'Complaint not found'
        });
    }
  
    // Handle file uploads
    if (req.files && req.files.length > 0) {
        const uploadedFiles = req.files.map(file => file.filename);
        complaint.files = [...complaint.files, ...uploadedFiles];
    }
  
    // Update complaint status
    complaint.assignedTo = admin._id; // Use the admin's ObjectId
    complaint.status = 'Escalated';
    complaint.statusHistory.push({
        status: 'Escalated',
        updatedBy: req.user._id,
        comment: instructions,
        timestamp: new Date()
    });

    // Add notifications
    complaint.notifications.push(
        {
            message: `Complaint escalated by ${req.user.name} with instructions: ${instructions}`,
            read: false
        },
        {
            message: `Your complaint has been escalated to the system administrator`,
            read: false
        }
    );
  
    await complaint.save();
  
    res.status(200).json({
        status: 'success',
        data: complaint
    });
});

// Bulk resolve complaints
exports.bulkResolveComplaints = catchAsync(async (req, res) => {
    const { complaintIds, resolution, comment } = req.body;

    const result = await Complaint.updateMany(
        { _id: { $in: complaintIds } },
        {
            $set: { status: 'Resolved' },
            $push: {
                statusHistory: {
                    status: 'Resolved',
                    updatedBy: req.user._id,
                    comment: resolution
                },
                notifications: {
                    message: 'Complaint resolved'
                }
            }
        }
    );

    res.status(200).json({
        status: 'success',
        data: {
            modified: result.nModified
        }
    });
});

// Get analytics
exports.getAnalytics = catchAsync(async (req, res) => {
    let match = {};
    
    // Filter based on user role
    if (req.user.role === 'hod') {
        match.program = req.user.program;
    } else if (req.user.role === 'coordinator') {
        match.program = { $in: req.user.programs };
    }

    const [
        totalComplaints,
        statusCounts,
        topComplaintTypes,
        topCourses
    ] = await Promise.all([
        Complaint.countDocuments(match),
        Complaint.aggregate([
            { $match: match },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        Complaint.aggregate([
            { $match: match },
            { $group: { _id: '$complaintType', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]),
        Complaint.aggregate([
            { $match: match },
            { $group: { _id: '$courseCode', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ])
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            totalComplaints,
            statusCounts: statusCounts.reduce((acc, curr) => {
                acc[curr._id] = curr.count;
                return acc;
            }, {}),
            topComplaintTypes,
            topCourses
        }
    });
});

// Handle file uploads
exports.uploadFiles = catchAsync(async (req, res) => {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
        return res.status(404).json({
            status: 'error',
            message: 'Complaint not found'
        });
    }

    if (!req.files || !req.files.length) {
        return res.status(400).json({
            status: 'error',
            message: 'No files uploaded'
        });
    }

    const files = req.files.map(file => ({
        filename: file.filename,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size,
        uploadedBy: req.user._id
    }));

    complaint.attachedFiles.push(...files);
    complaint.notifications.push({
        message: `Files uploaded by ${req.user.name}`
    });

    res.status(200).json({
        status: 'success',
        data: complaint.notifications
    });
});

// Add instruction to complaint
exports.addInstruction = catchAsync(async (req, res) => {
    const { instructions, files } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
        return res.status(404).json({
            status: 'error',
            message: 'Complaint not found'
        });
    }

    // Update complaint status and assignment
    complaint.status = 'Escalated';
    complaint.assignedTo = req.body.assignedTo; // ID of the admin user
    complaint._updatedBy = req.user._id;

    // Add instruction to status history
    complaint.statusHistory.push({
        status: 'Escalated',
        updatedBy: req.user._id,
        comment: instructions,
        timestamp: new Date()
    });

    // Add notifications for both admin and student
    complaint.notifications.push(
        {
            message: `Complaint escalated by ${req.user.name} with instructions: ${instructions}`,
            read: false,
            recipient: 'admin'
        },
        {
            message: `Your complaint has been escalated to the system administrator`,
            read: false,
            recipient: 'student'
        }
    );

    // Handle file attachments if any
    if (files && Object.keys(files).length > 0) {
        const fileEntries = Object.entries(files).map(([filename, file]) => ({
            filename,
            path: file.path,
            mimetype: file.mimetype,
            size: file.size,
            uploadedBy: req.user._id
        }));
        complaint.attachedFiles.push(...fileEntries);
    }

    await complaint.save();

    res.status(200).json({
        status: 'success',
        data: complaint
    });
});

// Resolve complaint (admin only)
exports.resolveComplaint = catchAsync(async (req, res) => {
    const { resolution, files } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
        return res.status(404).json({
            status: 'error',
            message: 'Complaint not found'
        });
    }

    // Update complaint status
    complaint.status = 'Resolved';
    complaint._updatedBy = req.user._id;

    // Add resolution to status history
    complaint.statusHistory.push({
        status: 'Resolved',
        updatedBy: req.user._id,
        comment: resolution,
        timestamp: new Date()
    });

    // Add notifications
    complaint.notifications.push(
        {
            message: `Complaint resolved by ${req.user.name}`,
            read: false,
            recipient: 'admin'
        },
        {
            message: `Your complaint has been resolved: ${resolution}`,
            read: false,
            recipient: 'student'
        }
    );

    // Handle file attachments if any
    if (files && Object.keys(files).length > 0) {
        const fileEntries = Object.entries(files).map(([filename, file]) => ({
            filename,
            path: file.path,
            mimetype: file.mimetype,
            size: file.size,
            uploadedBy: req.user._id
        }));
        complaint.attachedFiles.push(...fileEntries);
    }

    await complaint.save();

    res.status(200).json({
        status: 'success',
        data: complaint
    });
});

// Get admin complaints
exports.getAdminComplaints = catchAsync(async (req, res) => {
    // Find all complaints that are either escalated or assigned to admin
    const admin = await User.findOne({ role: 'admin' });
    
    if (!admin) {
        return res.status(404).json({
            status: 'error',
            message: 'Admin user not found'
        });
    }

    const complaints = await Complaint.find({
        $or: [
            { status: 'Escalated' },
            { assignedTo: admin._id }
        ]
    })
    .populate('createdBy', 'name email')
    .populate('assignedTo', 'name email')
    .populate('statusHistory.updatedBy', 'name email')
    .populate('comments.author', 'name email')
    .sort('-createdAt');

    res.status(200).json({
        status: 'success',
        data: complaints
    });
});