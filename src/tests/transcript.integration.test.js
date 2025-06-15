// src/tests/transcript.integration.test.js
const request = require('supertest');
const app = require('../../app');
const path = require('path');
const { createTestUser, createTranscriptRequest } = require('./helpers/testHelpers');
const { emailServiceMock, paymentServiceMock, pdfServiceMock } = require('./helpers/setupTests');

describe('Transcript Integration Tests', () => {
  describe('Transcript Request with Payment', () => {
    let studentUser, studentToken;

    beforeEach(async () => {
      ({ user: studentUser, token: studentToken } = await createTestUser());
    });

    it('should process payment and generate transcript request', async () => {
      const requestData = {
        level: 'L300',
        faculty: 'Engineering',
        program: 'Computer Science',
        semester: 'First Semester',
        modeOfTreatment: 'Super Fast',
        processingTime: 'Super Fast',
        numberOfCopies: 1,
        deliveryMethod: 'Collect from Faculty',
        amount: 3000,
        paymentDetails: {
          provider: 'MTN Mobile Money',
          phoneNumber: '+237600000000'
        }
      };

      const response = await request(app)
        .post('/api/transcripts/request')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(requestData);

      expect(response.status).toBe(201);
      expect(response.body.data.status).toBe('Processing');
      expect(response.body.data.amount).toBe(3000);
    });

    it('should handle payment failure correctly', async () => {
      const requestData = {
        level: 'L300',
        faculty: 'Engineering',
        program: 'Computer Science',
        semester: 'First Semester',
        modeOfTreatment: 'Fast',
        processingTime: 'Fast',
        numberOfCopies: 1,
        deliveryMethod: 'Collect from Faculty',
        amount: 2000,
        paymentDetails: {
          provider: 'MTN Mobile Money',
          phoneNumber: 'invalid-phone'  // invalid to force failure
        }
      };

      const response = await request(app)
        .post('/api/transcripts/request')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(requestData);

      expect(response.status).toBe(400);
      expect(response.body.error || response.body.message).toMatch(/(Payment Failed|Invalid phone number)/i);
    });

    it('should handle verification mode correctly', async () => {
      const verifierEmail = 'verifier@example.com';
      const requestData = {
        level: 'L300',
        faculty: 'Engineering',
        program: 'Computer Science',
        semester: 'First Semester',
        modeOfTreatment: 'Verification',
        processingTime: 'Normal',       // pre-save will keep it 'Normal'
        numberOfCopies: 1,
        deliveryMethod: 'Email Delivery',
        amount: 10000,
        verifierEmail,
        paymentDetails: {
          provider: 'Orange Money',
          phoneNumber: '+237123456789'
        }
      };

      const response = await request(app)
        .post('/api/transcripts/request')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(requestData);

      expect(response.status).toBe(201);
      expect(response.body.data.verifierEmail).toBe(verifierEmail);
      expect(response.body.data.amount).toBe(10000);
    });
  });

  describe('PDF Generation and Verification Mode', () => {
    let studentUser, adminUser, studentToken, adminToken;

    beforeEach(async () => {
      ({ user: studentUser, token: studentToken } = await createTestUser());
      ({ user: adminUser, token: adminToken } = await createTestUser({
        name: 'Admin User',
        email: 'admin@test.com',
        matricule: 'ADM001',
        role: 'admin'
      }));
    });

    test('should generate PDF when marking transcript as completed', async () => {
      const transcript = await createTranscriptRequest({ student: studentUser });

      const response = await request(app)
        .put(`/api/transcripts/${transcript._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'Completed',
          comment: 'Transcript processed and ready'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('Completed');
      expect(response.body.data.pdfUrl).toBeTruthy();

      expect(pdfServiceMock.getGeneratedPDFCount()).toBe(1);
      const generatedPDFs = pdfServiceMock.getPDFsForStudent(studentUser.matricule);
      expect(generatedPDFs).toHaveLength(1);

      const completionEmails = emailServiceMock.getEmailsSentTo(studentUser.email);
      expect(completionEmails).toHaveLength(1);
      expect(completionEmails[0].subject).toBe('Your Transcript is Ready');
    });

    test('should handle verification mode correctly', async () => {
      const verifierEmail = 'verifier@company.com';
      const requestData = {
        level: 'L300',
        faculty: 'Science',
        program: 'Biochemistry',
        semester: 'First Semester',
        modeOfTreatment: 'Verification',
        processingTime: 'Normal',
        numberOfCopies: 1,
        deliveryMethod: 'Email Delivery',
        amount: 10000,
        verifierEmail,
        paymentDetails: {
          provider: 'MTN Mobile Money',
          phoneNumber: '+237123456789'
        }
      };

      paymentServiceMock.setSuccessRate(1);

      const response = await request(app)
        .post('/api/transcripts/request')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(requestData);

      expect(response.status).toBe(201);
      expect(response.body.data.verifierEmail).toBe(verifierEmail);
      expect(response.body.data.amount).toBe(10000);

      const completionResponse = await request(app)
        .put(`/api/transcripts/${response.body.data._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'Completed',
          comment: 'Verified and sent'
        });

      expect(completionResponse.status).toBe(200);

      expect(pdfServiceMock.getGeneratedPDFCount()).toBe(1);
      const verifierEmails = emailServiceMock.getEmailsSentTo(verifierEmail);
      expect(verifierEmails).toHaveLength(1);
      expect(verifierEmails[0].subject).toBe('Transcript Verification Request');
    });
  });
});
