'use strict';
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('UserPermissions', [
      { userId: 1, permissionId: 1, granted: true, createdAt: new Date(), updatedAt: new Date() },
      { userId: 2, permissionId: 3, granted: false, createdAt: new Date(), updatedAt: new Date() }
    ]);
  },
  async down(queryInterface) { await queryInterface.bulkDelete('UserPermissions', null, {}); }
};