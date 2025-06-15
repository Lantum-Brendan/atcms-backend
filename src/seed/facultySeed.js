const mongoose = require('mongoose');
const Faculty = require('../models/facultyModel');
const logger = require('../utils/logger');

const seedFaculties = async () => {
  try {
    // Check existing faculties by their codes
    const existingFacultyCodes = new Set((await Faculty.find({}, 'code')).map(f => f.code));
    
    const faculties = [
        {
        name: 'College of Engineering',
        code: 'COT',
            programs: [
                { name: 'Computer Engineering', code: 'CEC' },
                { name: 'Electrical Engineering', code: 'EEC' },
                { name: 'Mechanical Engineering', code: 'MEC' },
            ],
        },
      
      {
        name: 'Faculty of Science',
        code: 'SCI',
        programs: [
          { name: 'Mathematics', code: 'MATH' },
          { name: 'Physics', code: 'PHYS' },
          { name: 'Chemistry', code: 'CHEM' },
        ],
      },
      {
        name: 'Faculty of Arts',
        code: 'ART',
        programs: [
          { name: 'Literature', code: 'LIT' },
          { name: 'History', code: 'HIST' },
        ],
      },
      
    ];

    const insertPromises = faculties
      .filter(faculty => !existingFacultyCodes.has(faculty.code))
      .map(async faculty => {
        try {
          const newFaculty = await Faculty.create(faculty);
          logger.info(`Created faculty: ${faculty.code}`);
          return newFaculty;
        } catch (error) {
          logger.error(`Failed to create faculty ${faculty.code}: ${error.message}`);
          return null;
        }
      });

    const insertedFaculties = (await Promise.all(insertPromises)).filter(Boolean);
    const totalPrograms = insertedFaculties.reduce((sum, fac) => sum + fac.programs.length, 0);
    
    if (insertedFaculties.length > 0) {
      logger.info(`Created ${insertedFaculties.length} new faculties with ${totalPrograms} programs`);
    } else {
      logger.info('No new faculties were created');
    }
  } catch (err) {
    logger.error('Error in seedFaculties:', err.message);
  }
};

module.exports = seedFaculties;