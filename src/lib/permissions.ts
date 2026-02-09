// MIRROR of api/permissions.ts
// In a monorepo, we would import this. Here we copy to ensure strict separation if needed, 
// or we can just alias in vite.config.ts if we want to share. 
// For now, to keep it simple and robust, we duplicate the types slightly or import if possible.
// Since /api is outside /src, Vite might not like importing directly without configuration.
// Let's safe-copy for Phase 1 to avoid build headaches.

export type UserRole = 'super_admin' | 'admin' | 'editor' | 'viewer';

export const PERMISSIONS = {
    // Category Permissions
    CATEGORY_READ: 'category.read',
    CATEGORY_WRITE: 'category.write',

    // Item Permissions
    ITEM_READ: 'item.read',
    ITEM_WRITE: 'item.write',

    // Quotation Permissions
    QUOTATION_READ: 'quotation.read',
    QUOTATION_WRITE: 'quotation.write',

    // User/Settings Permissions
    USER_READ: 'user.read',
    USER_WRITE: 'user.write',
    SETTINGS_MANAGE: 'settings.manage',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    super_admin: [
        PERMISSIONS.CATEGORY_READ,
        PERMISSIONS.CATEGORY_WRITE,
        PERMISSIONS.ITEM_READ,
        PERMISSIONS.ITEM_WRITE,
        PERMISSIONS.QUOTATION_READ,
        PERMISSIONS.QUOTATION_WRITE,
        PERMISSIONS.USER_READ,
        PERMISSIONS.USER_WRITE,
        PERMISSIONS.SETTINGS_MANAGE,
    ],
    admin: [
        PERMISSIONS.CATEGORY_READ,
        PERMISSIONS.CATEGORY_WRITE,
        PERMISSIONS.ITEM_READ,
        PERMISSIONS.ITEM_WRITE,
        PERMISSIONS.QUOTATION_READ,
        PERMISSIONS.QUOTATION_WRITE,
        PERMISSIONS.USER_READ,
        PERMISSIONS.USER_WRITE,
        PERMISSIONS.SETTINGS_MANAGE,
    ],
    editor: [
        PERMISSIONS.CATEGORY_READ,
        PERMISSIONS.CATEGORY_WRITE,
        PERMISSIONS.ITEM_READ,
        PERMISSIONS.ITEM_WRITE,
        PERMISSIONS.QUOTATION_READ,
        PERMISSIONS.QUOTATION_WRITE,
    ],
    viewer: [
        PERMISSIONS.CATEGORY_READ,
        PERMISSIONS.ITEM_READ,
        PERMISSIONS.QUOTATION_READ,
    ],
};

export const hasPermission = (role: UserRole | undefined | null, permission: Permission): boolean => {
    if (!role) return false;
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
};
