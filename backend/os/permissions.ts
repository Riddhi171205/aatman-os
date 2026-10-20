export type Role = 'admin' | 'user' | 'guest';

export type Permission =
  | 'read:messages'
  | 'write:messages'
  | 'read:memory'
  | 'write:memory'
  | 'execute:commands'
  | 'manage:users'
  | 'upload:files'
  | 'admin:all';

export const rolePermissions: Record<Role, Permission[]> = {
  admin: [
    'read:messages',
    'write:messages',
    'read:memory',
    'write:memory',
    'execute:commands',
    'manage:users',
    'upload:files',
    'admin:all',
  ],
  user: [
    'read:messages',
    'write:messages',
    'read:memory',
    'write:memory',
    'execute:commands',
    'upload:files',
  ],
  guest: [
    'read:messages',
    'read:memory',
  ],
};