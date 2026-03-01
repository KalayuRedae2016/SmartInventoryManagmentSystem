'use strict';
const bcrypt = require('bcryptjs');
const wharehouse = require('../models/warehouse');

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // Get SUPER_ADMIN role
    const [roles] = await queryInterface.sequelize.query(
      "SELECT id FROM Roles WHERE code='superAdmin' LIMIT 1;"
    );
    if (!roles || roles.length === 0) throw new Error('SUPER_ADMIN role not found. Seed roles first.');
    const superAdminRoleId = roles[0].id;
    const ownerRoleId = superAdminRoleId + 1; // Assuming ADMIN role follows SUPER_ADMIN

    const passwordHash = await bcrypt.hash('superAdmin@1234', 10);
    const ownerPasswordHash = await bcrypt.hash('owner@1234', 10);

    await queryInterface.bulkInsert('Users', [
      {
        businessId: 1,
        warehouseId:1,
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
        businessId: 1,
        warehouseId:1,
        roleId: ownerRoleId,
        fullName: 'Owner',
        email: 'kalayuredae2@gmail.com',
        phoneNumber: '123456780',
        password: ownerPasswordHash,
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
