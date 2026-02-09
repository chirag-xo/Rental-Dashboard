import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { type UserRole } from "@/lib/permissions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit2, UserPlus } from "lucide-react";
import { UserDrawer } from "./UserDrawer";
import { useAuth } from "@/hooks/useAuth";

export type AdminUser = {
    id: string;
    email: string;
    role: UserRole;
    is_active: boolean;
    last_sign_in_at?: string;
    created_at?: string;
};

export function UserList() {
    const { user } = useAuth();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        // We use the API endpoint because standard supabase client cannot list all users securely without Service Role
        // But our API endpoint /api/admin/users does exactly that.
        // We need to pass the current session token.

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const res = await fetch('/api/admin/users', {
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            } else {
                console.error("Failed to fetch users");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleEdit = (u: AdminUser) => {
        setSelectedUser(u);
        setIsDrawerOpen(true);
    };

    const handleCreate = () => {
        setSelectedUser(null);
        setIsDrawerOpen(true);
    };

    const handleSuccess = () => {
        setIsDrawerOpen(false);
        fetchUsers();
    };

    if (loading) {
        return <div className="space-y-4 p-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
        </div>;
    }

    return (
        <div className="space-y-4 p-4 pb-20 max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Team Members</h1>
                    <p className="text-sm text-muted-foreground">Manage access and roles</p>
                </div>
                <Button onClick={handleCreate} size="sm" className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    <span className="hidden sm:inline">Add Member</span>
                </Button>
            </div>

            <div className="grid gap-4">
                {users.map((u) => (
                    <Card key={u.id} className="overflow-hidden">
                        <CardContent className="p-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 overflow-hidden">
                                <Avatar className="h-10 w-10 border">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${u.email}`} />
                                    <AvatarFallback>{u.email[0].toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-medium truncate text-sm sm:text-base">
                                            {u.email}
                                        </p>
                                        {u.id === user?.id && <Badge variant="outline" className="text-[10px] h-5">You</Badge>}
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="capitalize text-[10px] sm:text-xs">
                                            {u.role}
                                        </Badge>
                                        <Badge variant={u.is_active ? 'outline' : 'destructive'} className="text-[10px] sm:text-xs">
                                            {u.is_active ? 'Active' : 'Disabled'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <Button variant="ghost" size="icon" onClick={() => handleEdit(u)}>
                                <Edit2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <UserDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                user={selectedUser}
                onSuccess={handleSuccess}
            />
        </div>
    );
}
