module.exports = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        status: 0,
        message: 'Authorization data missing'
      });
    }

    let permissions = req.user.role.permissions;

    // 🔐 SAFETY: convert string JSON to array if needed
    if (typeof permissions === 'string') {
      try {
        permissions = JSON.parse(permissions);
      } catch {
        permissions = [];
      }
    }

    console.log('User Permissions:', permissions);
    console.log('Required Permission:', requiredPermission);

    // ✅ WILDCARD ACCESS
    if (permissions.includes('*')) {
      return next();
    }

    if (!permissions.includes(requiredPermission)) {
      return res.status(403).json({
        status: 0,
        message: 'You do not have permission to perform this action'
      });
    }

    next();
  };
};
