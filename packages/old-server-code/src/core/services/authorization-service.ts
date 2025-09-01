export enum GlobalRole {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  USER = 'user'
}

export enum OrganizationRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer'
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class AuthorizationService {
  constructor(
    private userId: string,
    private organizationId: string,
    private roles: string[],
    private permissions: string[]
  ) {}
  
  authorize(requiredRole: GlobalRole | OrganizationRole): void {
    if (!this.hasRole(requiredRole)) {
      throw new AuthorizationError(`Required role: ${requiredRole}`);
    }
  }
  
  hasRole(role: string): boolean {
    return this.roles.includes(role);
  }
  
  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission) || 
           this.hasRole(GlobalRole.SUPERADMIN);
  }
  
  enforceAdminIfNotCurrentOrganization(targetOrgId: string): void {
    if (targetOrgId !== this.organizationId) {
      this.authorize(GlobalRole.SUPERADMIN);
    }
  }
  
  setDefaultOrganizationId<T extends { organizationId?: string }>(
    input: T
  ): T & { organizationId: string } {
    if (input.organizationId) {
      this.enforceAdminIfNotCurrentOrganization(input.organizationId);
      return input as T & { organizationId: string };
    }
    return { ...input, organizationId: this.organizationId };
  }
  
  enforceResourceAccess(resourceOrgId: string, resourceUserId?: string): void {
    if (this.hasRole(GlobalRole.SUPERADMIN)) return;
    
    if (resourceOrgId !== this.organizationId) {
      throw new AuthorizationError('Cross-organization access denied');
    }
    
    if (resourceUserId && resourceUserId !== this.userId) {
      if (!this.hasRole(OrganizationRole.ADMIN)) {
        throw new AuthorizationError('Resource access denied');
      }
    }
  }
}