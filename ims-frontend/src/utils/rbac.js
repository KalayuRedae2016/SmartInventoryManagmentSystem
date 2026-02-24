function asString(value) {
  return String(value || '').trim();
}

export function normalizePermissions(input) {
  // Accept API permissions as array, JSON string, or comma-separated list.
  if (!input) return [];
  if (Array.isArray(input)) {
    return input
      .flatMap(item => {
        if (!item) return [];
        if (typeof item === 'string') return [item];
        if (typeof item === 'object') {
          const value =
            item.permission ||
            item.name ||
            item.code ||
            item.key ||
            item.slug ||
            '';
          return value ? [String(value)] : [];
        }
        return [String(item)];
      })
      .map(value => value.trim())
      .filter(Boolean);
  }
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return normalizePermissions(parsed);
      return [];
    } catch {
      return input
        .split(',')
        .map(part => part.trim())
        .filter(Boolean);
    }
  }
  return [];
}

export function normalizeRole(role) {
  if (!role) return { name: '', code: '' };
  if (typeof role === 'string') {
    return { name: asString(role), code: asString(role).toUpperCase() };
  }
  const name = asString(role.name || role.label || role.value || role.role);
  const code = asString(role.code || name).toUpperCase();
  return { id: role.id, name, code };
}

export function isOwnerRole(role) {
  const normalized = normalizeRole(role);
  return normalized.code === 'OWNER' || normalized.name.toLowerCase() === 'owner';
}

export function hasPermission(authState, permission) {
  if (!permission) return true;
  const role = normalizeRole(authState?.role);
  const permissions = normalizePermissions(authState?.permissions);

  // Owner and wildcard permissions bypass per-permission checks.
  if (isOwnerRole(role)) return true;
  if (permissions.includes('*')) return true;

  return permissions.includes(permission);
}
