import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../utils.js';

// Session Constants
const MAX_SESSION_HOURS = 8;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // 1. Authenticate with Supabase
        const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
            email,
            password
        });

        if (authError || !authData.session) {
            return res.status(401).json({ error: authError?.message || 'Invalid credentials' });
        }

        const userId = authData.user.id;
        const sessionStartedAt = new Date().toISOString();

        // 2. Check if user is active in our custom users table
        const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .select('is_active')
            .eq('id', userId)
            .single();

        if (userError && userError.code !== 'PGRST116') {
            console.error('Error checking user status:', userError);
            return res.status(500).json({ error: 'Failed to verify user status' });
        }

        if (userData && !userData.is_active) {
            // Sign them out immediately
            await supabaseAdmin.auth.signOut();
            return res.status(403).json({ error: 'Account is deactivated' });
        }

        // 3. Store session_started_at in user metadata for max session enforcement
        await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: {
                session_started_at: sessionStartedAt
            }
        });

        // 4. Return session info (frontend will store in context)
        return res.status(200).json({
            user: {
                id: authData.user.id,
                email: authData.user.email
            },
            session: {
                access_token: authData.session.access_token,
                refresh_token: authData.session.refresh_token,
                expires_at: authData.session.expires_at,
                session_started_at: sessionStartedAt,
                max_session_hours: MAX_SESSION_HOURS
            }
        });

    } catch (err: any) {
        console.error('Login error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
