// Admin specific types
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  permissions: string[];
}

export type AdminRole = 'super_admin' | 'admin' | 'staff' | 'viewer';

export interface AdminPermission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}