// Source of Truth for Permissions
// This file defines all role capabilities.

export type UserRole = 'admin' | 'editor' | 'viewer';

export const PERMISSIONS = {
    // Category Permissions
    CATEGORY_READ: 'category.read',
    CATEGORY_WRITE: 'category.write', // Create, Update, Delete

    // Item Permissions
    ITEM_READ: 'item.read',
    ITEM_WRITE: 'item.write',

    // Quotation Permissions
    QUOTATION_READ: 'quotation.read',
    QUOTATION_WRITE: 'quotation.write',

    // User/Settings Permissions
    USER_READ: 'user.read',
    USER_WRITE: 'user.write', // Create, Edit, Deactivate
    SETTINGS_MANAGE: 'settings.manage',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Role -> Permission Mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
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
        // Editors cannot manage users or settings
    ],
    viewer: [
        PERMISSIONS.CATEGORY_READ,
        PERMISSIONS.ITEM_READ,
        PERMISSIONS.QUOTATION_READ,
        // View-only access
    ],
};

export const hasPermission = (role: UserRole, permission: Permission): boolean => {
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
};
