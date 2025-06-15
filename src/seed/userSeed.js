const mongoose = require('mongoose');
const User = require('../models/userModel');
const Faculty = require('../models/facultyModel');
const logger = require('../utils/logger');

const seedUsers = async () => {
  try {
    const existingUsers = await User.find({});

    // If users already exist, skip seeding
    if (existingUsers.length > 0) {
      logger.info(`Skipping user seeding - ${existingUsers.length} users already exist`);
      return;
    }

    logger.info('Starting user seeding process...');

    const users = [
      {
        name: 'System Admin',
        email: 'admin@atcms.com',
        password: 'admin123', // Plain password, hashed by pre('save')
        role: 'admin',
        status: 'Active',
        createdDate: new Date(),
        matricule: 'staff-1'
      },
      {
        name: 'Eng Coordinator',
        email: 'eng.coord@atcms.com',
        password: 'coord123', // Plain password
        role: 'coordinator',
        faculty: 'COT',
        programs: ['CEC', 'EEC', 'MEC'],
        status: 'Active',
        createdDate: new Date(),
        matricule: 'staff-2'
      },
      {
        name: 'Sci Coordinator',
        email: 'sci.coord@atcms.com',
        password: 'coord123', // Plain password
        role: 'coordinator',
        faculty: 'SCI',
        programs: ['MATH', 'PHYS', 'CHEM'],
        status: 'Active',
        createdDate: new Date(),
        matricule: 'staff-3'
      },
      {
        name: 'Art Coordinator',
        email: 'art.coord@atcms.com',
        password: 'coord123', // Plain password
        role: 'coordinator',
        faculty: 'ART',
        programs: ['LIT', 'HIST'],
        status: 'Active',
        createdDate: new Date(),
        matricule: 'staff-4'
      },
      {
        name: 'Computer Eng HOD',
        email: 'cec.hod@atcms.com',
        password: 'hod123', // Plain password
        role: 'hod',
        faculty: 'COT',
        program: 'CEC',
        status: 'Active',
        createdDate: new Date(),
        matricule: 'staff-5'
      },
      {
        name: 'Electrical Eng HOD',
        email: 'eec.hod@atcms.com',
        password: 'hod123', // Plain password
        role: 'hod',
        faculty: 'COT',
        program: 'EEC',
        status: 'Active',
        createdDate: new Date(),
        matricule: 'staff-6'
      },
      {
        name: 'Mechanical Eng HOD',
        email: 'mec.hod@atcms.com',
        password: 'hod123', // Plain password
        role: 'hod',
        faculty: 'COT',
        program: 'MEC',
        status: 'Active',
        createdDate: new Date(),
        matricule: 'staff-7'
      },
      {
        name: 'Mathematics HOD',
        email: 'math.hod@atcms.com',
        password: 'hod123', // Plain password
        role: 'hod',
        faculty: 'SCI',
        program: 'MATH',
        status: 'Active',
        createdDate: new Date(),
        matricule: 'staff-8'
      },
      {
        name: 'PHYSICS HOD',
        email: 'Phy.hod@atcms.com',
        password: 'hod123', // Plain password
        role: 'hod',
        faculty: 'SCI',
        program: 'PHYS',
        status: 'Active',
        createdDate: new Date(),
        matricule: 'staff-10'
      },
      {
        name: 'Literature HOD',
        email: 'lit.hod@atcms.com',
        password: 'hod123', // Plain password
        role: 'hod',
        faculty: 'ART',
        program: 'LIT',
        status: 'Active',
        createdDate: new Date(),
        matricule: 'staff-9'
      },
    ];

    const insertPromises = users.map(async user => {
      try {
        const newUser = await User.create(user);
        logger.info(`✓ Created ${user.role}: ${user.email}`);
        return newUser;
      } catch (error) {
        logger.error(`✗ Failed to create ${user.role} ${user.email}: ${error.message}`);
        return null;
      }
    });

    const insertedUsers = (await Promise.all(insertPromises)).filter(Boolean);

    if (insertedUsers.length > 0) {
      logger.info('----------------------------------------');
      logger.info(`Users seeding completed at ${new Date().toLocaleString()}`);
      logger.info(`Successfully created ${insertedUsers.length} users:`);
      logger.info(`- ${insertedUsers.filter(u => u.role === 'admin').length} administrators`);
      logger.info(`- ${insertedUsers.filter(u => u.role === 'coordinator').length} coordinators`);
      logger.info(`- ${insertedUsers.filter(u => u.role === 'hod').length} HODs`);
      logger.info('----------------------------------------');
    } else {
      logger.info('No new users were created');
    }
  } catch (err) {
    logger.error('Error in seedUsers:', err.message);
  }
};

module.exports = seedUsers;
