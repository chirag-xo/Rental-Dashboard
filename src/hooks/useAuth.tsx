import { useState, useEffect, createContext, useContext, useCallback, type ReactNode } from "react";
import { type User, type Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { type UserRole, hasPermission, type Permission } from "@/lib/permissions";
import { useIdleTimer, SESSION_CONSTANTS } from "./useIdleTimer";
import { SessionExpiryModal } from "@/components/SessionExpiryModal";

type AuthContextType = {
    session: Session | null;
    user: User | null;
    role: UserRole | null;
    loading: boolean;
    can: (permission: Permission) => boolean;
    signOut: () => Promise<void>;
    sessionStartedAt: string | null;
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    role: null,
    loading: true,
    can: () => false,
    signOut: async () => { },
    sessionStartedAt: null,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<UserRole | null>(null);
    const [loading, setLoading] = useState(true);
    const [sessionStartedAt, setSessionStartedAt] = useState<string | null>(null);
    const [showExpiryWarning, setShowExpiryWarning] = useState(false);

    // Sign out function
    const signOut = useCallback(async () => {
        try {
            // Call logout API to clear server-side session data
            const accessToken = session?.access_token;
            if (accessToken) {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                }).catch(() => { }); // Ignore errors, continue with client logout
            }
        } catch (e) {
            // Ignore errors
        }
        await supabase.auth.signOut();
        setSessionStartedAt(null);
    }, [session?.access_token]);

    // Idle timer integration
    const { isWarning, continueSession } = useIdleTimer({
        idleTimeout: SESSION_CONSTANTS.IDLE_TIMEOUT_MS,
        warningTime: SESSION_CONSTANTS.WARNING_TIME_MS,
        onIdle: () => {
            console.log('Session idle timeout - logging out');
            signOut();
        },
        onWarning: () => {
            console.log('Session expiry warning triggered');
            setShowExpiryWarning(true);
        },
        onActive: () => {
            setShowExpiryWarning(false);
        },
        disabled: !user // Only track idle when logged in
    });

    // Max session lifetime check (frontend layer)
    useEffect(() => {
        if (!user || !sessionStartedAt) return;

        const checkMaxSession = () => {
            const startTime = new Date(sessionStartedAt).getTime();
            const now = Date.now();
            const hoursElapsed = (now - startTime) / (1000 * 60 * 60);

            if (hoursElapsed > SESSION_CONSTANTS.MAX_SESSION_HOURS) {
                console.log('Max session lifetime exceeded - logging out');
                signOut();
            }
        };

        // Check immediately
        checkMaxSession();

        // Check every minute
        const interval = setInterval(checkMaxSession, 60 * 1000);

        return () => clearInterval(interval);
    }, [user, sessionStartedAt, signOut]);

    useEffect(() => {
        // 1. Initial Session Load
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                // Get session_started_at from user metadata
                const startedAt = session.user.user_metadata?.session_started_at;
                setSessionStartedAt(startedAt || new Date().toISOString());
                fetchProfile(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // 2. Auth State Listener
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                const startedAt = session.user.user_metadata?.session_started_at;
                setSessionStartedAt(startedAt || new Date().toISOString());
                fetchProfile(session.user.id);
            } else {
                setRole(null);
                setSessionStartedAt(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId: string) => {
        try {
            // 1. Get is_active from public.users
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('is_active')
                .eq('id', userId)
                .single();

            if (userError && userError.code !== 'PGRST116') {
                console.error("Error loading user:", userError);
                return;
            }

            // Enforce deactivation
            if (userData && !userData.is_active) {
                await supabase.auth.signOut();
                setRole(null);
                return;
            }

            // 2. Get Role from user_roles -> roles
            const { data: roleData, error: roleError } = await supabase
                .from('user_roles')
                .select('role:roles(name)')
                .eq('user_id', userId)
                .single();

            if (roleError && roleError.code !== 'PGRST116') {
                console.error("Error loading role:", roleError);
            }

            // Safe cast/fallback
            const roleName = (roleData?.role as any)?.name as UserRole;
            setRole(roleName || 'viewer'); // Default to viewer if no role found

        } catch (error) {
            console.error("Error loading profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const can = (permission: Permission) => {
        return hasPermission(role, permission);
    };

    const handleContinueSession = () => {
        setShowExpiryWarning(false);
        continueSession();
    };

    const handleLogoutFromWarning = () => {
        setShowExpiryWarning(false);
        signOut();
    };

    return (
        <AuthContext.Provider value={{ session, user, role, loading, can, signOut, sessionStartedAt }}>
            {children}
            <SessionExpiryModal
                isOpen={showExpiryWarning && isWarning}
                onContinue={handleContinueSession}
                onLogout={handleLogoutFromWarning}
                minutesRemaining={Math.round(SESSION_CONSTANTS.WARNING_TIME_MS / 60000)}
            />
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
