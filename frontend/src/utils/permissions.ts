import type { CurrentUser } from '../context/AppContext';

export function isAdmin(user: CurrentUser | null | undefined): boolean {
  if (!user) return false;
  const perms = user.permissions || [];
  const roles = user.functional_roles || [];
  return perms.includes('*:*') || roles.includes('admin');
}

export function hasPermission(user: CurrentUser | null | undefined, permission: string): boolean {
  if (!user) return false;
  const perms = user.permissions || [];
  if (perms.includes('*:*')) return true;
  if (permission.startsWith('user:') && perms.includes('iam:manage')) return true;
  return perms.includes(permission);
}

export function hasAnyPermission(user: CurrentUser | null | undefined, required: string[] | undefined): boolean {
  if (!required || required.length === 0) return true;
  if (!user) return false;
  if (isAdmin(user)) return true;
  const perms = user.permissions || [];
  return required.some(r => {
    if (perms.includes(r)) return true;
    if (r.startsWith('user:') && perms.includes('iam:manage')) return true;
    return false;
  });
}

export function permissionStatus(user: CurrentUser | null | undefined, permission: string): 'granted' | 'denied' {
  return hasPermission(user, permission) ? 'granted' : 'denied';
}

export function hasWorkspaceAccess(user: CurrentUser | null | undefined, workspaceKey: string): boolean {
  if (!user) return false;
  if (isAdmin(user)) return true;
  const perms = user.permissions || [];

  // Workspace-specific keys are expressed as `${key}:read` or `${key}:*` etc.
  if (workspaceKey === 'operations') {
    const opsKeys = ['field_ops', 'maintenance', 'manufacturing', 'projects', 'qa', 'qt', 'logistics'];
    return perms.some(p => opsKeys.some(ok => p.startsWith(`${ok}:`)));
  }
  if (workspaceKey === 'finance') {
    const finKeys = ['accounting', 'invoicing', 'payments', 'banking', 'taxes', 'reports', 'budget', 'shares'];
    return perms.some(p => finKeys.some(fk => p.startsWith(`${fk}:`)));
  }
  return perms.some(p => p.startsWith(`${workspaceKey}:`));
}

export default {
  isAdmin,
  hasPermission,
  hasAnyPermission,
  permissionStatus,
  hasWorkspaceAccess,
};
