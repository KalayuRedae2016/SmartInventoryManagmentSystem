'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // Get SUPER_ADMIN role
    const [roles] = await queryInterface.sequelize.query(
      "SELECT id FROM Roles WHERE code='SUPER_ADMIN' LIMIT 1;"
    );
    if (!roles || roles.length === 0) throw new Error('SUPER_ADMIN role not found. Seed roles first.');
    const superAdminRoleId = roles[0].id;
    const adminRoleId = superAdminRoleId + 1; // Assuming ADMIN role follows SUPER_ADMIN

    const passwordHash = await bcrypt.hash('123456', 10);
    const adminPasswordHash = await bcrypt.hash('Admin@123', 10);

    await queryInterface.bulkInsert('Users', [
      {
        tenantId: 1,
        roleId: superAdminRoleId,
        fullName: 'System Admin',
        email: 'kalayureda2016@gmail.com',
        phoneNumber: '1234567890',
        password: passwordHash,
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        tenantId: 1,
        roleId: adminRoleId,
        fullName: 'Admin',
        email: 'kalayuredae2@gmail.com',
        phoneNumber: '123456780',
        password: adminPasswordHash,
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Users', null, {});
  }
};
