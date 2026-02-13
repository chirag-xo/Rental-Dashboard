import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    useInventory,
    type InventoryCategory,
    type InventoryItem,
    type MeterOption,
    AVAILABLE_LENGTHS
} from "@/store/inventoryStore";
import { Plus, Trash2, Edit2, ChevronDown, ChevronRight, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ItemSearchInput } from "@/components/ItemSearchInput";
import { UserList } from "@/components/Admin/UserList";
import { useAuth } from "@/hooks/useAuth";
import { PERMISSIONS } from "@/lib/permissions";

function SignOutButton() {
    const { signOut } = useAuth();
    return (
        <Button variant="outline" onClick={signOut} className="gap-2 text-xs text-destructive hover:text-destructive">
            <LogOut className="h-3 w-3" /> Sign Out
        </Button>
    );
}

export default function AdminPanel() {
    const { user, loading, can } = useAuth();

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    if (!user) {
        return <AdminLogin />;
    }

    // Role Check: If user cannot read items, they shouldn't be here at all? 
    // Actually, AdminPanel is the container.
    // We should show what they CAN see.

    return (
        <Layout title="Admin Console" subtitle={`Logged in as ${user.email}`}>
            <div className="pb-20">
                <Tabs defaultValue="inventory" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                        <TabsTrigger value="inventory">Inventory</TabsTrigger>
                        {can(PERMISSIONS.USER_READ) && (
                            <TabsTrigger value="users">Team Members</TabsTrigger>
                        )}
                    </TabsList>

                    <TabsContent value="inventory" className="space-y-4">
                        {can(PERMISSIONS.CATEGORY_WRITE) ? (
                            <CategoryManager />
                        ) : (
                            <div className="p-8 text-center text-muted-foreground border rounded-lg border-dashed">
                                You do not have permission to manage inventory.
                            </div>
                        )}
                    </TabsContent>

                    {can(PERMISSIONS.USER_READ) && (
                        <TabsContent value="users">
                            <UserList />
                        </TabsContent>
                    )}
                </Tabs>

                {/* Sign Out Button - Always visible */}
                <div className="mt-8 flex justify-center">
                    <SignOutButton />
                </div>
            </div>
        </Layout>
    );
}

function AdminLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");


    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const { supabase } = await import("@/lib/supabase");

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        }
        // Auth state listener in Provider will handle redirect/state update context
    };

    return (
        <Layout title="Admin Access" subtitle="Please sign in to continue">
            <Card className="max-w-md mx-auto mt-8">
                <CardHeader>
                    <CardTitle>Sign In</CardTitle>
                    <CardDescription>Enter your credentials to access the dashboard.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Password</Label>
                            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Signing in..." : "Sign In"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </Layout>
    );
}


function CategoryManager() {
    const {
        categories,
        addCategory,
        deleteCategory,
        updateCategory,
        updateCategoryLengths,
        addItem,
        updateItem,
        deleteItem,
        getAllKnownItems
    } = useInventory();

    const [newCatName, setNewCatName] = useState("");
    const [selectedLengths, setSelectedLengths] = useState<MeterOption[]>(AVAILABLE_LENGTHS);

    // Compute known items for search
    const knownItems = useMemo(() => getAllKnownItems(), [categories]);

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newCatName.trim()) {
            const result = await addCategory(newCatName.trim(), selectedLengths);

            if (result.success) {
                if (result.message) {
                    alert(result.message); // Show warning/merge info
                }
                setNewCatName("");
                setSelectedLengths(AVAILABLE_LENGTHS);
            } else {
                if (result.message) {
                    alert(result.message); // Show error (e.g. all lengths duplicates)
                }
            }
        }
    };

    const toggleNewCatLength = (len: MeterOption) => {
        setSelectedLengths(prev =>
            prev.includes(len)
                ? prev.filter(l => l !== len)
                : [...prev, len].sort((a, b) => a - b)
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Inventory Management</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Add Category */}
                    <form onSubmit={handleAddCategory} className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                placeholder="New Category Name (e.g. Sound, Lighting)"
                                value={newCatName}
                                onChange={(e) => setNewCatName(e.target.value)}
                                className="bg-card border-border flex-1"
                            />
                            <Button type="submit">
                                <Plus className="h-4 w-4 mr-2" /> Add Category
                            </Button>
                        </div>
                        {/* Length Selection */}
                        <div className="flex flex-wrap gap-4 items-center border p-3 rounded-md bg-muted/20">
                            <span className="text-sm font-medium text-muted-foreground mr-2">Supported Lengths:</span>
                            {AVAILABLE_LENGTHS.map((len) => (
                                <div key={len} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`new-cat-len-${len}`}
                                        checked={selectedLengths.includes(len)}
                                        onCheckedChange={() => toggleNewCatLength(len)}
                                    />
                                    <Label htmlFor={`new-cat-len-${len}`} className="cursor-pointer">{len}m</Label>
                                </div>
                            ))}
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* List Categories */}
            <div className="space-y-4">
                <AnimatePresence>
                    {categories.map((cat) => (
                        <motion.div
                            key={cat.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            layout
                        >
                            <CategoryCard
                                category={cat}
                                knownItems={knownItems}
                                onDelete={() => {
                                    if (confirm(`Delete category "${cat.name}" and all its items?`)) {
                                        deleteCategory(cat.id);
                                    }
                                }}
                                onRename={(name) => updateCategory(cat.id, name)}
                                onUpdateLengths={(lengths) => updateCategoryLengths(cat.id, lengths)}
                                onAddItem={(item) => addItem(cat.id, item)}
                                onUpdateItem={(itemId, updates) => updateItem(cat.id, itemId, updates)}
                                onDeleteItem={(itemId) => deleteItem(cat.id, itemId)}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Migration Tool */}
            {/* Migration Tool - Hidden by default */}
            {/* <div className="pt-8 border-t">
                <h3 className="text-sm font-semibold mb-2">Data Migration</h3>
                <Button
                    variant="outline"
                    onClick={async () => {
                        if (confirm("This will attempt to read 'jd_rentals_inventory_v1' from your browser storage and upload it to Supabase. Continue?")) {
                            // @ts-ignore
                            const res = await migrateFromLocalStorage();
                            alert(res);
                        }
                    }}
                >
                    Migrate Legacy Local Data
                </Button>
            </div> */}
        </div>
    );
}

function CategoryCard({
    category,
    knownItems,
    onDelete,
    onRename,
    onUpdateLengths,
    onAddItem,
    onUpdateItem,
    onDeleteItem
}: {
    category: InventoryCategory;
    knownItems: InventoryItem[];
    onDelete: () => void;
    onRename: (name: string) => void;
    onUpdateLengths: (lengths: MeterOption[]) => void;
    onAddItem: (item: Omit<InventoryItem, "id">) => void;
    onUpdateItem: (id: string, updates: Partial<InventoryItem>) => void;
    onDeleteItem: (id: string) => void;
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Edit State for Category
    const [editName, setEditName] = useState(category.name);
    const [editLengths, setEditLengths] = useState<MeterOption[]>(category.supportedLengths || []);

    // Active Length Tab
    const activeLengths = category.supportedLengths || [];
    const [activeTab, setActiveTab] = useState<MeterOption | null>(activeLengths[0] || null);

    // New Item State
    const [newItemName, setNewItemName] = useState("");
    const [newItemQty, setNewItemQty] = useState("");
    const [newItemWeight, setNewItemWeight] = useState("");
    const [isAddingItem, setIsAddingItem] = useState(false);

    // Sync active tab if lengths change
    if (activeTab === null && activeLengths.length > 0) {
        setActiveTab(activeLengths[0]);
    }

    const filteredItems = category.items.filter(item => item.length === activeTab);

    const handleSaveEdit = () => {
        if (editName.trim()) {
            onRename(editName.trim());
            onUpdateLengths(editLengths);
            setIsEditing(false);
        }
    };

    const toggleLength = (val: MeterOption) => {
        setEditLengths(prev =>
            prev.includes(val)
                ? prev.filter(v => v !== val)
                : [...prev, val].sort((a, b) => a - b)
        );
    };

    const handleAddItemSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newItemName.trim() && activeTab && newItemQty) {
            // Check for duplicates
            const duplicate = filteredItems.find(i => i.name.toLowerCase() === newItemName.trim().toLowerCase());
            if (duplicate) {
                alert(`Item "${duplicate.name}" already exists in ${activeTab}m. Please update its quantity instead.`);
                return;
            }

            onAddItem({
                name: newItemName.trim(),
                length: activeTab,
                quantity: parseInt(newItemQty),
                weightPerPcKg: newItemWeight ? parseFloat(newItemWeight) : null,
            });
            setNewItemName("");
            setNewItemQty("");
            setNewItemWeight("");
            setIsAddingItem(false);
        }
    };

    const handleSuggestionSelect = (item: InventoryItem) => {
        setNewItemName(item.name);
        if (item.weightPerPcKg) {
            setNewItemWeight(item.weightPerPcKg.toString());
        }
    };

    return (
        <Card>
            <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2 flex-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsExpanded(!isExpanded)}>
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>

                    {isEditing ? (
                        <div className="flex flex-col gap-2 flex-1 mr-4">
                            <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="h-8 w-full"
                                autoFocus
                            />
                            <div className="flex flex-wrap gap-2 items-center text-sm border p-2 rounded-md bg-muted/20">
                                <span className="font-medium text-xs text-muted-foreground w-full">Supported Lengths:</span>
                                {AVAILABLE_LENGTHS.map((len) => (
                                    <div key={len} className="flex items-center space-x-1">
                                        <Checkbox
                                            id={`len-${category.id}-${len}`}
                                            checked={editLengths.includes(len)}
                                            onCheckedChange={() => toggleLength(len)}
                                        />
                                        <Label htmlFor={`len-${category.id}-${len}`} className="text-xs cursor-pointer">{len}m</Label>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" onClick={handleSaveEdit} className="h-7 text-xs">Save Changes</Button>
                                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="h-7 text-xs">Cancel</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col select-none cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                            <CardTitle className="text-base font-medium">
                                {category.name} <span className="text-xs text-muted-foreground ml-2 font-normal">({category.items.length} items)</span>
                            </CardTitle>

                        </div>
                    )}
                </div>
                {!isEditing && (
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}><Edit2 className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                )}
            </CardHeader>

            {isExpanded && !isEditing && (
                <CardContent className="p-0 border-t border-border">
                    {/* Tabs */}
                    <div className="flex overflow-x-auto border-b border-border bg-muted/10 px-4 pt-2 gap-1 scrollbar-hide">
                        {activeLengths.map(len => (
                            <button
                                key={len}
                                onClick={() => setActiveTab(len)}
                                className={`
                                    px-3 py-1.5 text-xs font-medium rounded-t-md border-t border-x border-transparent transition-all
                                    ${activeTab === len
                                        ? "bg-background border-border text-primary -mb-px relative z-10"
                                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                    }
                                `}
                            >
                                {len}m
                            </button>
                        ))}
                        {activeLengths.length === 0 && (
                            <p className="text-xs text-muted-foreground py-2 italic font-medium">No lengths supported. Edit category to add.</p>
                        )}
                    </div>

                    <div className="p-4 space-y-4 min-h-[100px]">
                        {/* Filtered Items List */}
                        {activeTab ? (
                            <div className="space-y-2">
                                {filteredItems.length === 0 && (
                                    <p className="text-sm text-center text-muted-foreground py-8 border border-dashed rounded-lg bg-muted/10">
                                        No items for {activeTab}m.
                                    </p>
                                )}
                                {filteredItems.map(item => (
                                    <ItemRow
                                        key={item.id}
                                        item={item}
                                        onUpdate={(updates) => onUpdateItem(item.id, updates)}
                                        onDelete={() => onDeleteItem(item.id)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-4 text-sm text-muted-foreground">Select a length to view items.</div>
                        )}

                        {/* Add Item Form - Context Aware */}
                        {activeTab && (
                            <>
                                {isAddingItem ? (
                                    <div className="bg-primary/5 p-3 rounded-lg border border-primary/10 mt-4 animate-in fade-in zoom-in-95">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="text-xs font-bold uppercase text-primary tracking-wider">
                                                Add Item to {activeTab}m
                                            </h4>
                                            <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => setIsAddingItem(false)}>
                                                <ChevronDown className="h-3 w-3" />
                                            </Button>
                                        </div>
                                        <form onSubmit={handleAddItemSubmit} className="space-y-3">
                                            <div className="grid grid-cols-6 gap-3">
                                                <div className="col-span-3">
                                                    <Label className="text-xs">Name</Label>
                                                    <ItemSearchInput
                                                        value={newItemName}
                                                        onChange={setNewItemName}
                                                        onSelect={handleSuggestionSelect}
                                                        knownItems={knownItems}
                                                        placeholder="Search or Enter Name"
                                                    />
                                                </div>
                                                <div className="col-span-1">
                                                    <Label className="text-xs text-muted-foreground">Length</Label>
                                                    <div className="h-8 flex items-center justify-center bg-muted rounded text-xs font-medium text-muted-foreground">
                                                        {activeTab}m
                                                    </div>
                                                </div>
                                                <div className="col-span-1">
                                                    <Label className="text-xs">Qty</Label>
                                                    <Input
                                                        type="number"
                                                        value={newItemQty}
                                                        onChange={e => setNewItemQty(e.target.value)}
                                                        className="h-8 bg-background px-2"
                                                        required
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <div className="col-span-1">
                                                    <Label className="text-xs">Wt (kg)</Label>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        value={newItemWeight}
                                                        onChange={e => setNewItemWeight(e.target.value)}
                                                        className="h-8 bg-background px-2"
                                                        placeholder="0"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex gap-2 pt-1">
                                                <Button type="button" variant="ghost" size="sm" className="flex-1 h-8 text-xs" onClick={() => setIsAddingItem(false)}>Cancel</Button>
                                                <Button type="submit" size="sm" className="flex-1 h-8 text-xs">Add Item</Button>
                                            </div>
                                        </form>
                                    </div>
                                ) : (
                                    <Button variant="outline" size="sm" className="w-full border-dashed text-xs h-9" onClick={() => setIsAddingItem(true)}>
                                        <Plus className="h-3.5 w-3.5 mr-2" /> Add Item to {activeTab}m
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                </CardContent>
            )}
        </Card>
    );
}

function ItemRow({
    item,
    onUpdate,
    onDelete
}: {
    item: InventoryItem;
    onUpdate: (updates: Partial<InventoryItem>) => void;
    onDelete: () => void;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(item.name);
    const [qty, setQty] = useState(item.quantity.toString());
    const [weight, setWeight] = useState(item.weightPerPcKg?.toString() || "");

    // Sync state with props when item changes (e.g. after external update)
    useEffect(() => {
        setName(item.name);
        setQty(item.quantity.toString());
        setWeight(item.weightPerPcKg?.toString() || "");
    }, [item]);

    const handleSave = () => {
        if (name && qty) {
            onUpdate({
                name,
                quantity: parseInt(qty),
                weightPerPcKg: weight ? parseFloat(weight) : null,
            });
            setIsEditing(false);
        }
    };

    if (isEditing) {
        return (
            <div className="flex flex-col gap-2 p-3 bg-muted/40 rounded-md border border-primary/20 animate-in fade-in">
                <div className="grid grid-cols-4 gap-2">
                    <div className="col-span-2">
                        <Label className="text-[10px] text-muted-foreground">Name</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} className="h-8 bg-background" placeholder="Name" />
                    </div>
                    <div className="col-span-1">
                        <Label className="text-[10px] text-muted-foreground">Qty</Label>
                        <Input type="number" value={qty} onChange={e => setQty(e.target.value)} className="h-8 bg-background" placeholder="0" />
                    </div>
                    <div className="col-span-1">
                        <Label className="text-[10px] text-muted-foreground">Wt/Pc</Label>
                        <Input type="number" step="0.01" value={weight} onChange={e => setWeight(e.target.value)} className="h-8 bg-background" placeholder="0" />
                    </div>
                </div>

                <div className="flex gap-2 justify-end mt-2">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button size="sm" className="h-7 text-xs" onClick={handleSave}>Save</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md group transition-colors">
            <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                </div>
                <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                    <span>Qty: <span className="font-medium text-foreground">{item.quantity}</span></span>
                    <span>Wt: <span className="font-medium text-foreground">{item.weightPerPcKg ?? "-"}</span> kg</span>
                </div>
            </div>
            <div className="flex items-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setIsEditing(true)}>
                    <Edit2 className="h-3 w-3 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => {
                    if (confirm("Delete this item?")) onDelete();
                }}>
                    <Trash2 className="h-3 w-3" />
                </Button>
            </div>
        </div>
    )
}
