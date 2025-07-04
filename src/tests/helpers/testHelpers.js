// Generated by Copilot
const mongoose = require('mongoose');
const TranscriptFactory = require('../factories/transcriptFactory');
const UserFactory = require('../factories/userFactory');
const testDb = require('./testDb');
const TranscriptRequest = require('../../models/transcriptModel');


const createTestUser = async (overrides = {}) => {
    return await UserFactory.create(overrides);
};


const createTestAdmin = async (overrides = {}) => {
    return await UserFactory.createAdmin(overrides);
};

const createTranscriptRequest = async ({ student }) => {
    return await TranscriptRequest.create({
        matricule: student.matricule,
        studentName: student.name,
        level: 'L300',
        faculty: 'Engineering',
        program: 'Computer Science',
        semester: 'First Semester',
        modeOfTreatment: 'Super Fast',
        processingTime: 'Super Fast',
        amount: 3000,
        numberOfCopies: 1,
        deliveryMethod: 'Collect from Faculty',
        paymentDetails: {
            provider: 'MTN Mobile Money',
            phoneNumber: '+237600000000'
        },
        createdBy: student._id,
        status: 'Processing'
    });
};

const clearTestData = async () => {
    if (process.env.NODE_ENV === 'test') {
        await testDb.clearDatabase();
    }
};

const createManyTranscripts = async (count, options = {}) => {
    const { student, ...overrides } = options;
    if (!student) {
        const { user } = await UserFactory.createStudent();
        options.student = user;
    }
    
    const transcripts = [];
    for (let i = 0; i < count; i++) {
        transcripts.push(await createTranscriptRequest(options));
    }
    return transcripts;
};

const createManyStudents = async (count, overrides = {}) => {
    return await UserFactory.createManyStudents(count, overrides);
};




module.exports = {
    createTestUser,
    createTestAdmin,
    createTranscriptRequest,
    createManyTranscripts,
    createManyStudents,
    clearTestData
};