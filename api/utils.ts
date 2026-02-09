import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { hasPermission, Permission, UserRole } from './permissions';

// Initialize Supabase Client (Service Role for Admin actions)
// Support both VITE_ prefixed (local) and non-prefixed (Vercel) env vars
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export type AuthenticatedRequest = VercelRequest & {
    user: {
        id: string;
        email: string;
        roles: string[]; // Changed from single role to array
        permissions: string[]; // Explicit permissions list
    };
};

type Handler = (req: AuthenticatedRequest, res: VercelResponse) => Promise<void | VercelResponse>;

// Helper: Fetch Full User Context (Hybrid Schema)
async function getUserContext(userId: string) {
    // Join: Users -> UserRoles -> Roles -> RolePermissions -> Permissions
    // Supabase JS doesn't do deep nested joins easily in one go without shaping.
    // We'll do a few queries or a stored procedure.
    // For V1, let's do chained queries, it's serverless/close to DB usually.

    // 1. Get User Profile & Org
    const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('*, organizations(name)')
        .eq('id', userId)
        .single();

    if (userError || !user) return null;

    // 2. Get Roles
    const { data: roleLinks } = await supabaseAdmin
        .from('user_roles')
        .select('role:roles(id, name)')
        .eq('user_id', userId);

    const roles = roleLinks?.map((r: any) => r.role.name) || [];

    // 3. Get Permissions
    // We need all permissions from all roles.
    const roleNames = roles; // e.g. ['admin', 'editor']

    // This query is tricky with supabase-js:
    // select permission(key) from role_permissions join roles, join permissions where role.name in roleNames

    const { data: permLinks } = await supabaseAdmin
        .from('role_permissions')
        .select(`
            permission:permissions(key),
            role:roles(name)
        `)
        .in('role.name', roleNames) // filter by role names we found? 
    // Actually, we can just filter by role_id from previous step to be safer
    // .in('role_id', roleLinks.map(r => r.role.id))

    // Actually, simpler:
    const roleIds = roleLinks?.map((r: any) => r.role.id) || [];

    const { data: rawPerms } = await supabaseAdmin
        .from('role_permissions')
        .select('permission:permissions(key)')
        .in('role_id', roleIds);

    const permissions = Array.from(new Set(rawPerms?.map((p: any) => p.permission.key) || []));

    return {
        user,
        roles,
        permissions
    };
}

export const withAuth = (requiredPermission: Permission | null, handler: Handler) => {
    return async (req: VercelRequest, res: VercelResponse) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).json({ error: 'Missing Authorization header' });
            }

            const token = authHeader.replace('Bearer ', '');

            // 2. Verify Token (Supabase Auth)
            const { data: { user: authUser }, error } = await supabaseAdmin.auth.getUser(token);

            if (error || !authUser) {
                return res.status(401).json({ error: 'Invalid token' });
            }

            // 3. Get Full Context from Custom Tables
            const context = await getUserContext(authUser.id);

            if (!context) {
                // Valid Auth User via JWT, but no row in public.users?
                // This implies a "Sync Error" or they were deleted.
                return res.status(403).json({ error: 'User profile not found.' });
            }

            const { user, roles, permissions } = context;

            // 4. Check Deactivation
            if (!user.is_active) {
                return res.status(403).json({ error: 'Account is deactivated' });
            }

            // 5. Check Permission
            if (requiredPermission) {
                if (!permissions.includes(requiredPermission)) {
                    // Super Admin Bypass? 
                    if (roles.includes('super_admin')) {
                        // allow
                    } else {
                        return res.status(403).json({ error: `Requires permission: ${requiredPermission}` });
                    }
                }
            }

            // 6. Attach
            (req as AuthenticatedRequest).user = {
                id: user.id,
                email: user.email,
                roles: roles,
                permissions: permissions
            };

            return handler(req as AuthenticatedRequest, res);

        } catch (err) {
            console.error('Auth Error:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    };
};
