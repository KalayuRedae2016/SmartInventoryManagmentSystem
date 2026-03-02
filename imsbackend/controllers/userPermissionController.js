const { UserPermission, User, Permission } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.assignPermissionsToUser = catchAsync(async (req, res, next) => {
  const userId=req.params.userId
  const {permissionIds, granted } = req.body;

  if (!userId || !Array.isArray(permissionIds)) return next(new AppError('userId and permissionIds required', 400));
  console.log(req.body)
  const user = await User.findOne({ where: { id: userId, businessId: req.user.businessId } });
  if (!user) return next(new AppError('User not found', 404));

  console.log("user",user)
  const userPermissions = permissionIds.map(pid => ({ userId, permissionId: pid, granted: granted ?? true }));
  console.log("user permissions",userPermissions)

  await UserPermission.bulkCreate(userPermissions, { updateOnDuplicate: ['granted'] });

  res.status(200).json({ 
    console:false,   
    status: 1, 
    message: `Permissions assigned to user ${user.fullName}`

  });
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
  const {userId}=req.params
  const {permissionId } = req.body;
  if (!userId || !permissionId) return next(new AppError('userId and permissionId required', 400));
  const deleted = await UserPermission.destroy({ where: { userId, permissionId } });
  if (!deleted) return next(new AppError('Permission not found for user', 404));
  res.status(200).json({ status: 1, message: 'Permission removed from user' });
});

exports.clearUserPermissions = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  await UserPermission.destroy({ where: { userId } });

  res.status(200).json({
    status: 1,
    message: 'All permissions removed for this user'
  });
});

exports.toggleUserPermission = catchAsync(async (req, res, next) => {
  const { userId, permissionId } = req.params;
  const perm = await UserPermission.findOne({ where: { userId, permissionId } });
  if (!perm) return next(new AppError('Permission not found for this user', 404));

  perm.granted = !perm.granted;
  await perm.save();

  res.status(200).json({
    status: 1,
    message: `Permission ${perm.granted ? 'granted' : 'revoked'} successfully`,
    data: perm
  });
});

exports.getUserPermissionSummary = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  const userPermissions = await UserPermission.findAll({
    where: { userId },
    include: [{ model: Permission, as: 'permission', attributes: ['id','key','module','description'] }]
  });

  const granted = userPermissions.filter(p => p.granted).length;
  const revoked = userPermissions.length - granted;

  const groupedByModule = userPermissions.reduce((acc, p) => {
    if (!acc[p.permission.module]) acc[p.permission.module] = [];
    acc[p.permission.module].push(p.permission);
    return acc;
  }, {});

  res.status(200).json({
    status: 1,
    totalPermissions: userPermissions.length,
    granted,
    revoked,
    byModule: groupedByModule
  });
});