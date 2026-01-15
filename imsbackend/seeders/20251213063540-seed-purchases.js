'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('Purchases', [{
      tenantId: 1,
      warehouseId: 1,
      supplierId: 1,
      totalAmount: 1000,
      paidAmount: 600,
      dueAmount: 400,
      paymentMethod: 'credit',
      status: 'partial',
      note: 'Initial test purchase',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Purchases', null, {});
  }
};
