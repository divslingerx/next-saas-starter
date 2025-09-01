import { AsyncLocalStorage } from 'async_hooks';
import { AuthorizationService } from '../services/authorization-service';

export interface GlobalContextData {
  userId?: string;
  organizationId: string;
  userPermissions: string[];
  userRoles: string[];
  authorizationService?: AuthorizationService;
  abortController: AbortController;
  requestTimeout?: number;
}

class GlobalContextManager {
  private als = new AsyncLocalStorage<GlobalContextData>();
  
  run<T>(context: GlobalContextData, callback: () => T): T {
    const authorizationService = context.userId ? new AuthorizationService(
      context.userId,
      context.organizationId,
      context.userRoles,
      context.userPermissions
    ) : undefined;
    
    const fullContext = {
      ...context,
      authorizationService
    };
    
    return this.als.run(fullContext, callback);
  }
  
  get(): GlobalContextData | undefined {
    return this.als.getStore();
  }
  
  get userId(): string | undefined {
    return this.get()?.userId;
  }
  
  get organizationId(): string {
    const context = this.get();
    if (!context?.organizationId) {
      throw new Error('No organization context available');
    }
    return context.organizationId;
  }
  
  get userPermissions(): string[] {
    return this.get()?.userPermissions || [];
  }
  
  get userRoles(): string[] {
    return this.get()?.userRoles || [];
  }
  
  get auth(): AuthorizationService {
    const context = this.get();
    if (!context?.authorizationService) {
      throw new Error('No authorization service available');
    }
    return context.authorizationService;
  }
  
  get signal(): AbortSignal {
    const context = this.get();
    if (!context?.abortController) {
      throw new Error('No abort controller available');
    }
    return context.abortController.signal;
  }
  
  get requestTimeout(): number | undefined {
    return this.get()?.requestTimeout;
  }
}

export const globalContext = new GlobalContextManager();