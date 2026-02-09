import { useState, useEffect, createContext, useContext, type ReactNode } from "react";
import { type User, type Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { type UserRole, hasPermission, type Permission } from "@/lib/permissions";

type AuthContextType = {
    session: Session | null;
    user: User | null;
    role: UserRole | null;
    loading: boolean;
    can: (permission: Permission) => boolean;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    role: null,
    loading: true,
    can: () => false,
    signOut: async () => { },
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<UserRole | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Initial Session Load
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) fetchProfile(session.user.id);
            else setLoading(false);
        });

        // 2. Auth State Listener
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setRole(null);
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

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ session, user, role, loading, can, signOut }
        }>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
