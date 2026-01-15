'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('PurchaseReturns', [{
      tenantId: 1,
      purchaseId: 1,
      supplierId: 1,
      warehouseId: 1,
      totalAmount: 200,
      reason: 'Damaged items',
      status: 'completed',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('PurchaseReturns', null, {});
  }
};
