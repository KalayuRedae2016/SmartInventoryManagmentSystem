'use strict';

const catchAsync = require('../utils/catchAsync');
const { syncMasterPermissions } = require('../services/permissionService');

exports.getPermissions = catchAsync(async (req, res, next) => {
  const permissions = await syncMasterPermissions();

  res.status(200).json({
    status: 1,
    data: permissions
  });
});

