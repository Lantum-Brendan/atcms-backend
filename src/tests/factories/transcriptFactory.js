// Generated by Copilot
const TranscriptRequest = require('../../models/transcriptModel');

class TranscriptFactory {
    static async create(overrides = {}) {
        const defaultData = {
            studentName: 'Test Student',
            matricule: `MAT${Date.now()}`,
            level: 'L300',
            semester: 'First Semester',
            faculty: 'Science',
            program: 'Computer Science',
            modeOfTreatment: 'Normal',
            numberOfCopies: 1,
            deliveryMethod: 'Collect from Faculty',
            status: 'Processing',
            amount: 1000,
            paymentDetails: {
                provider: 'MTN Mobile Money',
                phoneNumber: '+237123456789',
                transactionId: `TX${Date.now()}`
            }
        };

        const data = { ...defaultData, ...overrides };
        return await TranscriptRequest.create(data);
    }

    static async createMany(count, overrides = {}) {
        const transcripts = [];
        for (let i = 0; i < count; i++) {
            const transcript = await this.create(overrides);
            transcripts.push(transcript);
        }
        return transcripts;
    }

    static async createVerificationRequest(verifierEmail, overrides = {}) {
        const defaultData = {
            modeOfTreatment: 'Verification',
            verifierEmail,
            status: 'Processing',
            amount: 10000,
            verificationExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
            signature: `SIG_${Buffer.from(verifierEmail).toString('base64')}_${Date.now()}`
        };

        return await this.create({ ...defaultData, ...overrides });
    }

    static async createWithRandomStatus(overrides = {}) {
        const statuses = ['Processing', 'Pending Payment', 'Completed', 'Rejected'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        
        return await this.create({ 
            status: randomStatus,
            ...overrides 
        });
    }

    static async createCompletedTranscript(overrides = {}) {
        return await this.create({
            status: 'Completed',
            pdfUrl: `/uploads/transcripts/test_${Date.now()}.pdf`,
            completedAt: new Date(),
            ...overrides
        });
    }

    static generateMockTranscriptData() {
        return {
            courses: [
                { code: 'CEF301', title: 'Software Engineering', grade: 'A', credits: 6 },
                { code: 'CEF302', title: 'Database Systems', grade: 'B+', credits: 6 },
                { code: 'CEF303', title: 'Computer Networks', grade: 'A-', credits: 6 }
            ],
            gpa: 3.7,
            totalCredits: 18,
            academicYear: '2024/2025'
        };
    }
}

module.exports = TranscriptFactory;