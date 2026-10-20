import { Request, Response, NextFunction } from 'express';
import { rolePermissions, Permission } from '../os/permissions';

export function requirePermission(permission: Permission) {
  return (req: any, res: Response, next: NextFunction) => {
    const userRole = req.user?.role || 'guest';
    if (
      rolePermissions[userRole as keyof typeof rolePermissions]?.includes(permission) ||
      rolePermissions[userRole as keyof typeof rolePermissions]?.includes('admin:all')
    ) {
      return next();
    }
    return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
  };
}
