/**
 * User roles and permissions
 */

/**
 * User role enum
 */
export const USER_ROLES = {
    CUSTOMER: 'customer',
    DRIVER: 'driver',
    ADMIN: 'admin'
  };
  
  /**
   * Permission types
   */
  export const PERMISSIONS = {
    READ: 'read',
    WRITE: 'write',
    UPDATE: 'update',
    DELETE: 'delete'
  };
  
  /**
   * Role-based permissions
   */
  export const ROLE_PERMISSIONS = {
    [USER_ROLES.CUSTOMER]: {
      profile: [PERMISSIONS.READ, PERMISSIONS.UPDATE],
      request: [PERMISSIONS.READ, PERMISSIONS.WRITE, PERMISSIONS.UPDATE],
      offer: [PERMISSIONS.READ],
      payment: [PERMISSIONS.READ, PERMISSIONS.WRITE, PERMISSIONS.UPDATE],
      review: [PERMISSIONS.READ, PERMISSIONS.WRITE]
    },
    [USER_ROLES.DRIVER]: {
      profile: [PERMISSIONS.READ, PERMISSIONS.UPDATE],
      request: [PERMISSIONS.READ],
      offer: [PERMISSIONS.READ, PERMISSIONS.WRITE, PERMISSIONS.UPDATE],
      earnings: [PERMISSIONS.READ],
      location: [PERMISSIONS.READ, PERMISSIONS.UPDATE],
      review: [PERMISSIONS.READ]
    },
    [USER_ROLES.ADMIN]: {
      // Admin has all permissions for all resources
      '*': Object.values(PERMISSIONS)
    }
  };
  
  /**
   * Check if a role has a specific permission for a resource
   * @param {string} role - User role
   * @param {string} resource - Resource name
   * @param {string} permission - Permission type
   * @returns {boolean} Whether the role has the permission
   */
  export const hasPermission = (role, resource, permission) => {
    // Admin has all permissions
    if (role === USER_ROLES.ADMIN) return true;
    
    // Check if role exists
    if (!ROLE_PERMISSIONS[role]) return false;
    
    // Check if role has permissions for resource
    const roleResourcePermissions = ROLE_PERMISSIONS[role][resource];
    if (!roleResourcePermissions) return false;
    
    // Check if role has specific permission for resource
    return roleResourcePermissions.includes(permission);
  };