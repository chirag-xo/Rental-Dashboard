import type { VercelResponse } from '@vercel/node';
import { AuthenticatedRequest, supabaseAdmin, withAuth } from '../utils.js';
import { PERMISSIONS } from '../permissions.js';

// Helper to get JD Rental Org ID (since we only have 1 for now)
async function getDefaultOrgId() {
    const { data } = await supabaseAdmin.from('organizations').select('id').eq('name', 'JD Rental').single();
    return data?.id;
}

const handler = async (req: AuthenticatedRequest, res: VercelResponse) => {
    const method = req.method;

    try {
        // 1. GET: List Users
        if (method === 'GET') {
            // Query our custom `users` table including roles
            // Supabase-js syntax for nested: select *, user_roles(role:roles(name))

            const { data: users, error } = await supabaseAdmin
                .from('users')
                .select(`
            *,
            user_roles (
                role:roles ( name )
            )
        `);

            if (error) throw error;

            // Transform to flat format for UI
            const formatted = users.map(u => ({
                id: u.id,
                email: u.email,
                is_active: u.is_active,
                created_at: u.created_at,
                // UI expects single "role" for display, but we support multiple.
                // For V1 UI compatibility, pick the "highest" or first role.
                role: u.user_roles?.[0]?.role?.name || 'viewer',
                roles: u.user_roles?.map((ur: any) => ur.role.name) || []
            }));

            return res.status(200).json(formatted);
        }

        // 2. POST: Create User
        if (method === 'POST') {
            const { email, password, role } = req.body; // role name like 'admin'

            if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

            const orgId = await getDefaultOrgId();
            if (!orgId) return res.status(500).json({ error: 'Default Organization not found' });

            // A. Create in Supabase Auth
            const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true
            });

            if (createError) throw createError;
            const userId = authData.user.id;

            // B. Insert into public.users
            const { error: userError } = await supabaseAdmin
                .from('users')
                .insert({
                    id: userId,
                    organization_id: orgId,
                    email,
                    is_active: true
                });

            if (userError) {
                // Clean up auth user to prevent zombie state?
                await supabaseAdmin.auth.admin.deleteUser(userId);
                throw userError;
            }

            // C. Assign Role
            // Find role id first
            const { data: roleData } = await supabaseAdmin.from('roles').select('id').eq('name', role || 'viewer').single();
            if (roleData) {
                await supabaseAdmin.from('user_roles').insert({
                    user_id: userId,
                    role_id: roleData.id
                });
            }

            return res.status(201).json({ message: 'User created' });
        }

        // 3. PUT: Update User (Role / Active Status)
        if (method === 'PUT') {
            const { id, role, is_active } = req.body;

            if (!id) return res.status(400).json({ error: 'User ID is required' });

            // Update is_active in users table
            if (typeof is_active === 'boolean') {
                await supabaseAdmin.from('users').update({ is_active }).eq('id', id);
            }

            // Update Roles
            // For V1 UI which sends a single 'role', we wipe and replace.
            if (role) {
                // Validate role exists
                const { data: roleData } = await supabaseAdmin.from('roles').select('id').eq('name', role).single();

                if (roleData) {
                    // Delete existing
                    await supabaseAdmin.from('user_roles').delete().eq('user_id', id);
                    // Insert new
                    await supabaseAdmin.from('user_roles').insert({
                        user_id: id,
                        role_id: roleData.id
                    });
                }
            }

            return res.status(200).json({ message: 'User updated' });
        }

        // 4. DELETE: Remove User
        if (method === 'DELETE') {
            const { id } = req.body;

            if (!id) return res.status(400).json({ error: 'User ID is required' });

            // A. Delete from user_roles
            await supabaseAdmin.from('user_roles').delete().eq('user_id', id);

            // B. Delete from public.users
            await supabaseAdmin.from('users').delete().eq('id', id);

            // C. Delete from Supabase Auth
            const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
            if (authError) throw authError;

            return res.status(200).json({ message: 'User deleted' });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (err: any) {
        console.error('API Error:', err);
        return res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
};

export default withAuth(PERMISSIONS.USER_READ, async (req, res) => {
    // Permission checks same as before
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
        const { hasPermission, PERMISSIONS } = await import('../permissions.js');
        // Check "user.write" permission
        // Note: req.user.permissions is now an Array of strings
        if (!req.user.permissions.includes(PERMISSIONS.USER_WRITE)) {
            return res.status(403).json({ error: 'Requires USER_WRITE permission' });
        }
    }
    return handler(req, res);
});
