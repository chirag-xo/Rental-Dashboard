import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useInventory, type InventoryCategory, type InventoryItem } from "@/store/inventoryStore";
import { Plus, Trash2, Edit2, ChevronDown, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminPanel() {
    return (
        <Layout title="Admin Panel" subtitle="Manage your inventory categories and items">
            <div className="space-y-6 pb-20">
                <CategoryManager />
            </div>
        </Layout>
    );
}

function CategoryManager() {
    const { categories, addCategory, deleteCategory, updateCategory, updateCategoryLengths, addItem, updateItem, deleteItem } = useInventory();
    const [newCatName, setNewCatName] = useState("");

    // Default lengths for new categories
    // const [selectedLengths, setSelectedLengths] = useState<number[]>([20, 30, 40, 50]); // Unused

    const handleAddCategory = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCatName.trim()) {
            addCategory(newCatName.trim());
            setNewCatName("");
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Inventory Management</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Add Category */}
                    <form onSubmit={handleAddCategory} className="flex gap-2">
                        <Input
                            placeholder="New Category Name (e.g. Sound, Lighting)"
                            value={newCatName}
                            onChange={(e) => setNewCatName(e.target.value)}
                            className="bg-card border-border"
                        />
                        <Button type="submit">
                            <Plus className="h-4 w-4 mr-2" /> Add Category
                        </Button>
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
        </div>
    );
}

function CategoryCard({
    category,
    onDelete,
    onRename,
    onUpdateLengths,
    onAddItem,
    onUpdateItem,
    onDeleteItem
}: {
    category: InventoryCategory;
    onDelete: () => void;
    onRename: (name: string) => void;
    onUpdateLengths: (lengths: number[]) => void;
    onAddItem: (item: Omit<InventoryItem, "id">) => void;
    onUpdateItem: (id: string, updates: Partial<InventoryItem>) => void;
    onDeleteItem: (id: string) => void;
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Edit State
    const [editName, setEditName] = useState(category.name);
    const [editLengths, setEditLengths] = useState<number[]>(category.supportedLengths || [20, 30, 40, 50]);

    // New Item State
    const [newItemName, setNewItemName] = useState("");
    // We now use qtyOverrides to hold new item quantities per length
    const [newItemQtys, setNewItemQtys] = useState<Record<number, string>>({});
    const [newItemWeight, setNewItemWeight] = useState("");
    const [isAddingItem, setIsAddingItem] = useState(false);

    const activeLengths = category.supportedLengths || [20, 30, 40, 50];

    const handleSaveEdit = () => {
        if (editName.trim()) {
            onRename(editName.trim());
            onUpdateLengths(editLengths);
            setIsEditing(false);
        }
    };

    const toggleLength = (val: number) => {
        setEditLengths(prev =>
            prev.includes(val)
                ? prev.filter(v => v !== val)
                : [...prev, val].sort((a, b) => a - b)
        );
    };

    const handleAddItemSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newItemName.trim()) {
            // Build overrides object
            const overrides: Record<number, number> = {};
            activeLengths.forEach(len => {
                const q = parseInt(newItemQtys[len] || "0");
                if (!isNaN(q)) overrides[len] = q;
            });

            // Use 30m as 'defaultQty' fallback or just 0
            const defaultQ = parseInt(newItemQtys[30] || "0") || 0;

            onAddItem({
                name: newItemName.trim(),
                defaultQty: defaultQ,
                qtyOverrides: overrides,
                weightPerPcKg: newItemWeight ? parseFloat(newItemWeight) : null,
            });
            setNewItemName("");
            setNewItemQtys({});
            setNewItemWeight("");
            setIsAddingItem(false);
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
                            <div className="flex items-center gap-2 w-full">
                                <Input
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="h-8 w-full"
                                    autoFocus
                                />
                            </div>
                            <div className="flex flex-wrap gap-3 items-center text-sm border p-2 rounded-md bg-muted/20">
                                <span className="font-medium text-xs text-muted-foreground">Lengths:</span>
                                {[20, 30, 40, 50].map((len) => (
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
                            <div className="flex gap-1 mt-1">
                                {activeLengths.map(l => (
                                    <span key={l} className="bg-muted px-1.5 py-0.5 rounded text-[10px] text-muted-foreground">{l}m</span>
                                ))}
                            </div>
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
                    <div className="p-4 space-y-4">
                        {/* Items List */}
                        <div className="space-y-2">
                            {category.items.length === 0 && (
                                <p className="text-sm text-center text-muted-foreground py-4">No items yet.</p>
                            )}
                            {category.items.map(item => (
                                <ItemRow
                                    key={item.id}
                                    item={item}
                                    activeLengths={activeLengths}
                                    onUpdate={(updates) => onUpdateItem(item.id, updates)}
                                    onDelete={() => onDeleteItem(item.id)}
                                />
                            ))}
                        </div>

                        {/* Add Item Form */}
                        {isAddingItem ? (
                            <div className="bg-muted/30 p-3 rounded-lg border border-border mt-4">
                                <h4 className="text-xs font-semibold uppercase mb-2">New Item</h4>
                                <form onSubmit={handleAddItemSubmit} className="space-y-3">
                                    <div>
                                        <Label className="text-xs">Name</Label>
                                        <Input value={newItemName} onChange={e => setNewItemName(e.target.value)} className="h-8 bg-background" required placeholder="Item Name" />
                                    </div>

                                    <div>
                                        <Label className="text-xs">Quantities per Length</Label>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {activeLengths.map(len => (
                                                <div key={len} className="w-16">
                                                    <span className="text-[10px] text-muted-foreground block text-center mb-0.5">{len}m</span>
                                                    <Input
                                                        type="number"
                                                        value={newItemQtys[len] || ""}
                                                        onChange={e => setNewItemQtys(prev => ({ ...prev, [len]: e.target.value }))}
                                                        className="h-8 bg-background text-center px-1"
                                                        placeholder="0"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="text-xs">Wt/Pc (kg)</Label>
                                        <Input type="number" step="0.01" value={newItemWeight} onChange={e => setNewItemWeight(e.target.value)} className="h-8 bg-background" placeholder="0" />
                                    </div>

                                    <div className="flex gap-2 pt-1">
                                        <Button type="button" variant="ghost" size="sm" className="flex-1 h-8" onClick={() => setIsAddingItem(false)}>Cancel</Button>
                                        <Button type="submit" size="sm" className="flex-1 h-8">Save Item</Button>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => setIsAddingItem(true)}>
                                <Plus className="h-3.5 w-3.5 mr-2" /> Add Item
                            </Button>
                        )}
                    </div>
                </CardContent>
            )}
        </Card>
    );
}

function ItemRow({
    item,
    activeLengths,
    onUpdate,
    onDelete
}: {
    item: InventoryItem;
    activeLengths: number[];
    onUpdate: (updates: Partial<InventoryItem>) => void;
    onDelete: () => void;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(item.name);
    // Initialize overrides from item or default
    const [qtys, setQtys] = useState<Record<number, string>>(() => {
        const initial: Record<number, string> = {};
        activeLengths.forEach(len => {
            if (item.qtyOverrides && item.qtyOverrides[len] !== undefined) {
                initial[len] = item.qtyOverrides[len].toString();
            } else {
                // Fallback display if no override exists but we want to show something?
                // Or we can just leave empty to imply 0 or default scaling?
                // Let's default to item.defaultQty if it's the 30m slot, else empty/0
                if (len === 30) initial[len] = item.defaultQty.toString();
            }
        });
        return initial;
    });
    const [weight, setWeight] = useState(item.weightPerPcKg?.toString() || "");

    const handleSave = () => {
        const overrides: Record<number, number> = {};
        activeLengths.forEach(len => {
            const q = parseInt(qtys[len] || "0");
            if (!isNaN(q)) overrides[len] = q;
        });

        const defaultQ = parseInt(qtys[30] || "0") || 0;

        onUpdate({
            name,
            defaultQty: defaultQ,
            qtyOverrides: overrides,
            weightPerPcKg: weight ? parseFloat(weight) : null,
        });
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="flex flex-col gap-2 p-3 bg-muted/40 rounded-md border border-primary/20">
                <Input value={name} onChange={e => setName(e.target.value)} className="h-8 bg-background" placeholder="Name" />

                <div className="flex flex-wrap gap-2">
                    {activeLengths.map(len => (
                        <div key={len} className="flex-1 min-w-[3rem]">
                            <label className="text-[10px] text-muted-foreground block text-center">{len}m</label>
                            <Input
                                type="number"
                                value={qtys[len] || ""}
                                onChange={e => setQtys(prev => ({ ...prev, [len]: e.target.value }))}
                                className="h-8 bg-background text-center px-1"
                            />
                        </div>
                    ))}
                </div>

                <div className="mt-1">
                    <label className="text-xs text-muted-foreground">Wt/Pc</label>
                    <Input type="number" step="0.01" value={weight} onChange={e => setWeight(e.target.value)} className="h-8 bg-background" placeholder="0" />
                </div>

                <div className="flex gap-2 justify-end mt-2">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button size="sm" className="h-7 text-xs" onClick={handleSave}>Save</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md group">
            <div className="flex-1 min-w-0 pr-2">
                <p className="font-medium text-sm truncate">{item.name}</p>
                <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                    {/* Show summary of quantities */}
                    <div className="flex gap-2">
                        {activeLengths.map(len => {
                            const q = item.qtyOverrides?.[len];
                            if (q !== undefined && q > 0) {
                                return <span key={len} className="bg-muted px-1 rounded">{len}m: {q}</span>;
                            }
                            // Fallback for classic defaultQty if no override
                            if (len === 30 && (!item.qtyOverrides || !item.qtyOverrides[30]) && item.defaultQty > 0) {
                                return <span key={len} className="bg-muted px-1 rounded">30m: {item.defaultQty}</span>
                            }
                            return null;
                        })}
                    </div>
                    <span>Wt: <span className="text-foreground font-medium">{item.weightPerPcKg ?? "-"}</span> kg</span>
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
