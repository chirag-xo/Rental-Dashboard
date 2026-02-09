import { useState, useEffect } from "react";
import { type AdminUser } from "./UserList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter
} from "@/components/ui/sheet";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";
import { Loader2, Trash2 } from "lucide-react";
import { type UserRole } from "@/lib/permissions";

interface UserDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    user: AdminUser | null;
    onSuccess: () => void;
}

export function UserDrawer({ isOpen, onClose, user, onSuccess }: UserDrawerProps) {
    const isEdit = !!user;
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: "", // Only for create
        role: "viewer" as UserRole,
        is_active: true
    });

    useEffect(() => {
        if (isOpen) {
            if (user) {
                setFormData({
                    email: user.email,
                    password: "",
                    role: user.role,
                    is_active: user.is_active
                });
            } else {
                setFormData({
                    email: "",
                    password: "",
                    role: "viewer",
                    is_active: true
                });
            }
        }
    }, [isOpen, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const url = '/api/admin/users';
            const method = isEdit ? 'PUT' : 'POST';

            const body: any = {
                role: formData.role,
                is_active: formData.is_active
            };

            if (isEdit) {
                body.id = user?.id;
            } else {
                body.email = formData.email;
                body.password = formData.password;
            }

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const err = await res.json();
                alert(`Error: ${err.error || 'Failed'}`);
                return;
            }

            onSuccess();
        } catch (error) {
            console.error(error);
            alert("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!user) return;
        if (!confirm(`Are you sure you want to permanently delete ${user.email}? This action cannot be undone.`)) {
            return;
        }

        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const res = await fetch('/api/admin/users', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ id: user.id })
            });

            if (!res.ok) {
                const err = await res.json();
                alert(`Error: ${err.error || 'Failed to delete'}`);
                return;
            }

            onSuccess();
        } catch (error) {
            console.error(error);
            alert("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="bottom" className="h-[90vh] sm:h-full sm:max-w-md overflow-y-auto rounded-t-[20px] sm:rounded-none">
                <SheetHeader className="mb-6">
                    <SheetTitle>{isEdit ? "Edit Member" : "Add New Member"}</SheetTitle>
                    <SheetDescription>
                        {isEdit
                            ? "Modify execution role and access status."
                            : "Create a new user with specific permissions."}
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email - Readonly if edit */}
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            disabled={isEdit || loading}
                            required
                        />
                    </div>

                    {/* Password - Only show on create */}
                    {!isEdit && (
                        <div className="space-y-2">
                            <Label htmlFor="password">Temporary Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                disabled={loading}
                                required
                                minLength={6}
                            />
                            <p className="text-xs text-muted-foreground">User can reset this later.</p>
                        </div>
                    )}

                    {/* Role Selection */}
                    <div className="space-y-2">
                        <Label>Role Assignment</Label>
                        <Select
                            value={formData.role}
                            onValueChange={(val: UserRole) => setFormData({ ...formData, role: val })}
                            disabled={loading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="viewer">
                                    <div className="flex flex-col text-left">
                                        <span className="font-medium">Viewer</span>
                                        <span className="text-xs text-muted-foreground">Read-only access</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="editor">
                                    <div className="flex flex-col text-left">
                                        <span className="font-medium">Editor</span>
                                        <span className="text-xs text-muted-foreground">Can manage inventory & quotations</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="admin">
                                    <div className="flex flex-col text-left">
                                        <span className="font-medium">Admin</span>
                                        <span className="text-xs text-muted-foreground">Full access + user management</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Active Status Switch */}
                    {isEdit && (
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label className="text-base">Active Account</Label>
                                <p className="text-xs text-muted-foreground">
                                    Disable to revoke access immediately
                                </p>
                            </div>
                            <Switch
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                disabled={loading}
                            />
                        </div>
                    )}

                    <SheetFooter className="mt-8 flex-col sm:flex-row gap-2">
                        {isEdit && (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={loading}
                                className="w-full sm:w-auto sm:mr-auto"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Account
                            </Button>
                        )}
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="flex-1 sm:flex-none">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading} className="flex-1 sm:flex-none">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEdit ? "Save Changes" : "Create Member"}
                            </Button>
                        </div>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
