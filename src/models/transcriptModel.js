const mongoose = require('mongoose');

const transcriptRequestSchema = new mongoose.Schema({
    matricule: {
        type: String,
        required: true,
        uppercase: true,
        index: true
    },
    studentName: {
        type: String,
        required: true
    },
    level: {
        type: String,
        required: true,
        validate: {
            validator: (v) => /^L[2-7]00$/.test(v),
            message: 'Level must be between L200 and L700'
        }
    },
    faculty: {
        type: String,
        required: true
    },
    program: {
        type: String,
        required: true
    },
    semester: {
        type: String,
        required: true,
        enum: ['First', 'Second']
    },
    modeOfTreatment: {
        type: String,
        required: true,
        enum: ['Super Fast', 'Fast', 'Normal', 'Verification']
    },
    processingTime: {
        type: String,
        required: true,
        enum: ['Normal', 'Fast', 'Super Fast']
    },
    amount: {
        type: Number,
        required: true,
        validate: {
            validator: function(value) {
                if (this.verifierEmail) {
                    return value === 10000;
                }
                const fees = {
                    'Normal': 1000,
                    'Fast': 2000,
                    'Super Fast': 3000
                };
                return value === fees[this.processingTime];
            },
            message: 'Amount must match processing time fee'
        }
    },
    dateOfRequest: {
        type: Date,
        default: Date.now,
        index: true
    },
    numberOfCopies: {
        type: Number,
        required: true,
        min: 1
    },
    deliveryMethod: {
        type: String,
        required: true,
        enum: ['Collect', 'Mail', 'Express'] // Verify these match your test data
    },
    verifierEmail: {
        type: String,
        required: function() {
            return this.modeOfTreatment === 'Verification';
        },
        validate: {
            validator: function(email) {
                return email ? /^\S+@\S+\.\S+$/.test(email) : true;
            },
            message: 'Invalid verifier email format'
        }
    },
    status: {
        type: String,
        required: true,
        enum: ['Processing', 'Completed', 'Failed'],
        default: 'Processing',
        index: true
    },
    paymentDetails: {
        provider: {
            type: String,
            enum: ['MTN', 'Orange', 'YooMee'],
            required: true
        },
        phoneNumber: {
            type: String,
            required: true,
            match: /^\+?[1-9]\d{1,14}$/
        },
        transactionId: String,
        paidAt: Date,
        amount: Number
    },
    statusHistory: [{
        status: {
            type: String,
            required: true,
            enum: ['Processing', 'Completed', 'Failed']
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
    }],
    pdfUrl: String,
    completedAt: Date,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Fix: Match enum with schema
transcriptRequestSchema.pre('save', function(next) {
    if (this.isNew || this.isModified('modeOfTreatment')) {
        switch (this.modeOfTreatment) {
            case 'Super Fast':
                this.processingTime = 'Super Fast';
                this.amount = 3000;
                break;
            case 'Fast':
                this.processingTime = 'Fast';
                this.amount = 2000;
                break;
            case 'Normal':
                this.processingTime = 'Normal';
                this.amount = 1000;
                break;
            case 'Verification':
                this.processingTime = 'Normal';
                this.amount = 10000;
                this.deliveryMethod = 'Email Delivery';
                break;
        }
    }
    next();
});

transcriptRequestSchema.virtual('isOverdue').get(function() {
    if (this.status !== 'Processing') return false;
    
    const now = new Date();
    const requestDate = this.dateOfRequest;
    const hours = (now - requestDate) / (1000 * 60 * 60);
    
    switch (this.modeOfTreatment) {
        case 'Super Fast': return hours > 24;
        case 'Fast': return hours > 48;
        case 'Verification': return hours > 72;
        case 'Normal': return hours > (30 * 24);
        default: return false;
    }
});

const TranscriptRequest = mongoose.model('TranscriptRequest', transcriptRequestSchema);
module.exports = TranscriptRequest;
