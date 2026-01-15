'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('PurchaseReturnItems', [{
      purchaseReturnId: 1,
      tenantId: 1,
      warehouseId: 1,
      productId: 1,
      quantity: 4,
      unitPrice: 50,
      total: 200,
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('PurchaseReturnItems', null, {});
  }
};
