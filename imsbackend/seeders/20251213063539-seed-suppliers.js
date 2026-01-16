'use strict';
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('Suppliers', [
      {
        businessId: 1,
        code: 'SUPP001',
        name: 'Global Supplies Ltd',
        phone: '1234567899',
        email: 'contact@globalsupplies.com',
        country: 'ETHIOPIA',
        city: 'New York',
        address: '123 Main St',
        taxNumber: 'TAX12345',
        totalPurchaseDue: 0,
        totalPurchaseReturnDue: 0,
        additionalInfo: 'Preferred supplier',
        createdAt: now,
        updatedAt: now
      },
      {
        businessId: 1,
        code: 'SUPP002',
        name: 'Tech Distributors Inc',
        phone: '0987654321',
        email: 'sales@techdistributors.com',
        country: 'ETHIOPIA',
        city: 'Los Angeles',
        address: '456 Tech Road',
        taxNumber: 'TAX67890',
        totalPurchaseDue: 0,
        totalPurchaseReturnDue: 0,
        additionalInfo: 'Handles electronics',
        createdAt: now,
        updatedAt: now
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Suppliers', null, {});
  }
};
