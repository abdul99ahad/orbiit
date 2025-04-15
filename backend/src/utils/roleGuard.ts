import { PermissionType } from '../enums/role.enum';
import { UnauthorizedException } from './appError';
import { RolePermissions } from './role-permission';

export const roleGuard = (
  role: keyof typeof RolePermissions,
  requiredPermission: PermissionType[]
) => {
  const permission = RolePermissions[role];
  const hasPermission = requiredPermission.every((p) => permission.includes(p));
  if (!hasPermission) {
    throw new UnauthorizedException(
      'You do not have the necessary permissions to perform this action'
    );
  }
};

