export type Principal = Readonly<{
  principalId: string;
}>;

export type Permission = string;

export type ResourceReference = Readonly<{
  resourceType: string;
  resourceId: string;
}>;

export interface AuthorizationService {
  requirePermission(
    principal: Principal,
    permission: Permission,
    resource?: ResourceReference,
  ): Promise<void>;
}

export type AccessModuleDependencies = Readonly<{
  authorization: AuthorizationService;
}>;

export type AccessModule = Readonly<{
  authorization: AuthorizationService;
}>;

export function createAccessModule(
  dependencies: AccessModuleDependencies,
): AccessModule {
  return Object.freeze({
    authorization: dependencies.authorization,
  });
}
