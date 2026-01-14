'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // 1. Get admin role
      const [adminRole] = await queryInterface.sequelize.query(
        `SELECT id FROM Roles WHERE code = 'SYS_ADMIN' LIMIT 1`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (!adminRole) {
        throw new Error('SYS_ADMIN role not found. Seed roles first.');
      }

      // 2. Check if admin user exists
      const [existing] = await queryInterface.sequelize.query(
        `SELECT id FROM Users WHERE email = 'admin@sophor.com' LIMIT 1`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      // 3. Insert if not exists
      if (!existing) {
        await queryInterface.bulkInsert('Users', [{
          fullName: 'System Administrator',
          email: 'admin@sophor.com',
          phoneNumber: '0900000000',
          password: await bcrypt.hash('Admin@123', 10),
          roleId: adminRole.id,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }]);
      }

    } catch (e) {
      console.error('User seed failed:', e);
      throw e;
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Users', { email: 'admin@sophor.com' });
  }
};
