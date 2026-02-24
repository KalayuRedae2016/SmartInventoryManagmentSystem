'use strict';

const { Permission } = require('../models');
const { buildMasterPermissionRecords } = require('../config/permissions');

async function syncMasterPermissions() {
  const masterRecords = buildMasterPermissionRecords();
  try {
    const existing = await Permission.findAll({ attributes: ['id', 'key'] });
    const existingKeys = new Set(existing.map(item => item.key));
    const toCreate = masterRecords.filter(item => !existingKeys.has(item.key));

    if (toCreate.length) {
      await Permission.bulkCreate(
        toCreate.map(item => ({
          key: item.key,
          name: item.name,
          description: item.description,
          isActive: true
        }))
      );
    }

    return Permission.findAll({
      where: { isActive: true },
      order: [['key', 'ASC']]
    });
  } catch (error) {
    // Fallback for environments where new Permission tables are not migrated yet.
    return masterRecords.map((item, index) => ({
      id: index + 1,
      key: item.key,
      name: item.name,
      description: item.description,
      isActive: true
    }));
  }
}

module.exports = {
  syncMasterPermissions
};
