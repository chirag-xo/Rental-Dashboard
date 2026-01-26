import { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search, Trash2 } from "lucide-react";
import { type CustomItem } from "@/hooks/usePersistence";
import { useInventory } from "@/store/inventoryStore";
import { v4 as uuidv4 } from "uuid";

type DirectItemAdderProps = {
    items: CustomItem[];
    onAdd: (item: CustomItem) => void;
    onRemove: (id: string) => void;
};

export function DirectItemAdder({ items, onAdd, onRemove }: DirectItemAdderProps) {
    const [name, setName] = useState("");
    const [qty, setQty] = useState("1");
    const [weight, setWeight] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);

    const wrapperRef = useRef<HTMLDivElement>(null);
    const { categories } = useInventory();

    // Flatten all items from inventory for search
    const allInventoryItems = useMemo(() => {
        return categories.flatMap(c => c.items);
    }, [categories]);

    // Filter suggestions based on input
    const filteredSuggestions = useMemo(() => {
        if (!name.trim()) return [];
        const lower = name.toLowerCase();
        return allInventoryItems.filter(i => i.name.toLowerCase().includes(lower));
    }, [allInventoryItems, name]);

    // Handle outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (item: { name: string; weightPerPcKg: number | null }) => {
        setName(item.name);
        if (item.weightPerPcKg !== null) {
            setWeight(item.weightPerPcKg.toString());
        }
        setShowSuggestions(false);
    };

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        // Check if item already exists in the *current direct items list* and merge if so?
        // The Requirement says "added items should appear in a list below".
        // If we add "Rajaigad" and "Rajaigad" again, should it merge in the list?
        // "Added items should appear in a list below: Item name, Qty, Remove button"
        // It implies distinct entries or merged entries. Merged is cleaner.
        // Let's implement merge here for the Local list before calling onAdd (which usually saves state)
        // Actually, onAdd should handle the logic or we calculate the merged item here.
        // The parent usually saves the list.
        // Let's create the object and let parent handles array update, but better to check duplicates here?
        // No, `mergeItems` utility is for calculations. Visual list might want merged too.
        // For simplicity, we just add, and let `RequirementForm` or `mergeItems` handle the final calc.
        // BUT, the prompt says "Added items should appear in a list below".
        // If user adds 'A' (qty 1) then 'A' (qty 2), list should probably show 'A' (qty 3).

        // However, standard props pattern is `onAdd(item)`. We'll rely on parent or just append for now,
        // and if visual merging is needed we do it. But simplified first: Just add.

        // Wait, "Step 2 custom add merges with existing items".
        // Step 1 direct items might effectively be a "custom list" too. 
        // We'll trust the plan: Step 1 just accumulates direct items. 
        // The "Merge Rules" apply to the FINAL list generation.
        // But visually for Step 1, let's keep them as separate entries for editability or merge them?
        // "Remove button" implies manageable list.
        // Let's leave them separate in the list for now so user can remove specific additions, 
        // OR better, merge if name matches to keep list clean.

        onAdd({
            id: uuidv4(),
            name: name.trim(),
            qty: parseInt(qty) || 1,
            weightPerPc: parseFloat(weight) || 0,
        });

        setName("");
        setQty("1");
        setWeight("");
        setShowSuggestions(false);
    };

    return (
        <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Search className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm">Add Direct Items</h3>
                </div>

                <form onSubmit={handleAddItem} className="space-y-3">
                    <div className="space-y-1 relative" ref={wrapperRef}>
                        <Label htmlFor="direct-search" className="text-xs">Search Item</Label>
                        <Input
                            id="direct-search"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setShowSuggestions(true);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            placeholder="Search item name..."
                            autoComplete="off"
                            className="bg-background"
                        />

                        {/* Suggestions Dropdown */}
                        {showSuggestions && filteredSuggestions.length > 0 && (
                            <div className="absolute z-20 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                                {filteredSuggestions.map((item, idx) => (
                                    <div
                                        key={`${item.id}-${idx}`}
                                        className="px-3 py-2 text-sm hover:bg-muted cursor-pointer transition-colors"
                                        onClick={() => handleSelect(item)}
                                    >
                                        <div className="font-medium">{item.name}</div>
                                        {item.weightPerPcKg && (
                                            <div className="text-xs text-muted-foreground">{item.weightPerPcKg} kg</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label htmlFor="direct-qty" className="text-xs">Quantity</Label>
                            <Input
                                id="direct-qty"
                                type="number"
                                min="1"
                                value={qty}
                                onChange={(e) => setQty(e.target.value)}
                                className="bg-background"
                            />
                        </div>
                        <div>
                            <Label htmlFor="direct-weight" className="text-xs">Weight (kg) <span className="text-muted-foreground font-normal">Optional</span></Label>
                            <Input
                                id="direct-weight"
                                type="number"
                                step="0.1"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                placeholder="0"
                                className="bg-background"
                            />
                        </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={!name.trim()}>
                        <Plus className="mr-2 h-4 w-4" /> Add to List
                    </Button>
                </form>
            </div>

            {/* Added Items List */}
            {items.length > 0 && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Added Items</h4>
                    <div className="space-y-2">
                        {items.map((item) => (
                            <div key={item.id} className="flex justify-between items-center bg-muted/30 border border-border rounded-lg p-2.5">
                                <div>
                                    <div className="font-medium text-sm">{item.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                        Qty: <span className="text-foreground">{item.qty}</span>
                                        {item.weightPerPc > 0 && <span> • {item.weightPerPc} kg/pc</span>}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onRemove(item.id)}
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

