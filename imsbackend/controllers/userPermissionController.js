const { UserPermission, User, Permission } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.assignPermissionsToUser = catchAsync(async (req, res, next) => {
  const { userId, permissionIds, granted } = req.body;
  if (!userId || !Array.isArray(permissionIds)) return next(new AppError('userId and permissionIds required', 400));
  const user = await User.findOne({ where: { id: userId, businessId: req.user.businessId } });
  if (!user) return next(new AppError('User not found', 404));
  const userPermissions = permissionIds.map(pid => ({ userId, permissionId: pid, granted: granted ?? true }));
  await UserPermission.bulkCreate(userPermissions, { updateOnDuplicate: ['granted'] });
  res.status(200).json({ status: 1, message: 'Permissions assigned to user' });
});

exports.getUserPermissions = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  console.log("user id ",req.params)
  const user = await User.findOne({ where: { id: userId, businessId: req.user.businessId }, include: [{ model: Permission, as: 'permissions' }] });
  if (!user) return next(new AppError('User not found', 404));

  res.status(200).json({ 
    Error:false,
    status: 1,
    message:"user Permissions Fetched Succefffullly",
    result:user.length,
    data: user.permissions });
});

exports.removePermissionFromUser = catchAsync(async (req, res, next) => {
  const { userId, permissionId } = req.body;
  if (!userId || !permissionId) return next(new AppError('userId and permissionId required', 400));
  const deleted = await UserPermission.destroy({ where: { userId, permissionId } });
  if (!deleted) return next(new AppError('Permission not found for user', 404));
  res.status(200).json({ status: 1, message: 'Permission removed from user' });
});