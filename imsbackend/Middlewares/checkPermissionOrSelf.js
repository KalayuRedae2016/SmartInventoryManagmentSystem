// Middlewares/checkPermissionOrSelf.js
const AppError = require('../Utils/appError');

module.exports = (permission) => {
  return (req, res, next) => {

    // If requesting own profile → allow
    if (req.user.id === Number(req.params.id)) {
      return next();
    }

    const permissions = req.user.role?.permissions || [];

    // Wildcard access
    if (permissions.includes('*')) {
      return next();
    }

    if (!permissions.includes(permission)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };
};
