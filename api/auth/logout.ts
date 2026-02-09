import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const authHeader = req.headers.authorization;

        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');

            // Get user from token to clear their session metadata
            const { data: { user } } = await supabaseAdmin.auth.getUser(token);

            if (user) {
                // Clear session_started_at from user metadata
                await supabaseAdmin.auth.admin.updateUserById(user.id, {
                    user_metadata: {
                        session_started_at: null
                    }
                });
            }
        }

        // Note: Supabase client-side will handle actual session signout
        // This endpoint is for server-side cleanup

        return res.status(200).json({ message: 'Logged out successfully' });

    } catch (err: any) {
        console.error('Logout error:', err);
        // Still return success - logout should always "succeed" from user perspective
        return res.status(200).json({ message: 'Logged out' });
    }
}
