'use strict';

const { buildMasterPermissionRecords } = require('../config/permissions');

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const permissions = buildMasterPermissionRecords().map(item => ({
      key: item.key,
      name: item.name,
      description: item.description,
      isActive: true,
      createdAt: now,
      updatedAt: now
    }));

    await queryInterface.bulkInsert('Permissions', permissions);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Permissions', null, {});
  }
};

