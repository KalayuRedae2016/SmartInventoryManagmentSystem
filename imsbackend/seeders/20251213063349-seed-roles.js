'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // Seed default roles
    await queryInterface.bulkInsert('Roles', [
      { businessId: 1, name: 'SuperAdmin', code: 'SUPER_ADMIN', permissions: JSON.stringify(['*']), description: 'System full access', isActive: true, createdAt: now, updatedAt: now },
       { businessId: 1, name: 'Owner', code: 'OWNER', permissions: JSON.stringify(['*']), description: 'System full access', isActive: true, createdAt: now, updatedAt: now },
      { businessId: 1, name: 'Admin', code: 'ADMIN', permissions: JSON.stringify(['*']), description: 'Full system access', isActive: true, createdAt: now, updatedAt: now },
      { businessId: 1, name: 'Warehouse Manager', code: 'WH_MANAGER', permissions: JSON.stringify(['warehouse.read','stock.adjust','stock.transfer','product.read']), description: 'Manage warehouse operations', isActive: true, createdAt: now, updatedAt: now },
      { businessId: 1, name: 'Finance', code: 'FINANCE', permissions: JSON.stringify(['purchase.read','sale.read','payment.manage','report.view']), description: 'Finance and accounting', isActive: true, createdAt: now, updatedAt: now }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Roles', null, {});
  }
};
