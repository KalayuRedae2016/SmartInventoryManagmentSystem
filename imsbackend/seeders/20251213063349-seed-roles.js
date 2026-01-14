'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const roles = [
      { name: 'SystemAdmin', code: 'SYS_ADMIN', permissions: ['*'], isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Admin', code: 'ADMIN', permissions: ['*'], isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Lab Technician', code: 'LAB_TECH', permissions: JSON.stringify(['lab_order_create','lab_result_view']), isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Doctor', code: 'DOCTOR', permissions: JSON.stringify(['patient_view','lab_order_create','lab_result_view']), isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'User', code: 'USER', permissions: JSON.stringify(['self_view','self_update']), isActive: true, createdAt: new Date(), updatedAt: new Date() }
    ];

    for (const role of roles) {
      const [existing] = await queryInterface.sequelize.query(
        `SELECT id FROM Roles WHERE code = '${role.code}' LIMIT 1`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      if (!existing) {
        await queryInterface.bulkInsert('Roles', [role]);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Roles', {
      code: ['ADMIN', 'LAB_TECH']
    });
  }
};
