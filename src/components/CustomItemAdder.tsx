import { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { type CustomItem } from "@/hooks/usePersistence";
import { useInventory, type InventoryItem, AVAILABLE_LENGTHS } from "@/store/inventoryStore";
import { v4 as uuidv4 } from "uuid";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type CustomItemAdderProps = {
    onAdd: (item: CustomItem) => void;
};

export function CustomItemAdder({ onAdd }: CustomItemAdderProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState("");
    const [qty, setQty] = useState("1");
    const [weight, setWeight] = useState("");
    const [length, setLength] = useState<string>("30"); // Default to 30m

    // Search state
    const { categories } = useInventory();
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const allItems = useMemo(() => {
        return categories.flatMap(c => c.items);
    }, [categories]);

    const filteredItems = useMemo(() => {
        if (!name) return allItems;
        const lower = name.toLowerCase();
        return allItems.filter(i => i.name.toLowerCase().includes(lower));
    }, [allItems, name]);

    // Handle outside click to close suggestions
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (item: InventoryItem) => {
        setName(item.name);
        if (item.weightPerPcKg !== null) {
            setWeight(item.weightPerPcKg.toString());
        }
        setShowSuggestions(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !qty) return;

        onAdd({
            id: uuidv4(),
            name,
            qty: parseInt(qty) || 1,
            weightPerPc: parseFloat(weight) || 0,
            length: parseInt(length), // Add length field
        });

        // Reset
        setName("");
        setQty("1");
        setWeight("");
        setLength("30"); // Reset to default
        setIsOpen(false);
        setShowSuggestions(false);
    };

    if (!isOpen) {
        return (
            <Button
                variant="secondary"
                className="w-full border-dashed border-2 border-muted-foreground/20 hover:border-primary/50"
                onClick={() => setIsOpen(true)}
            >
                <Plus className="mr-2 h-4 w-4" /> Add Custom Item
            </Button>
        );
    }

    return (
        <div className="bg-card border border-border rounded-lg p-4 space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-sm">Add Extra Item</h3>
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1 relative" ref={wrapperRef}>
                    <Label htmlFor="name">Item Name</Label>
                    <div className="relative">
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setShowSuggestions(true);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            required
                            placeholder="Search or enter item name..."
                            autoComplete="off"
                        />
                        {name && filteredItems.length > 0 && showSuggestions && (
                            <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-md max-h-48 overflow-y-auto">
                                {filteredItems.map(item => (
                                    <div
                                        key={item.id}
                                        className="px-3 py-2 text-sm hover:bg-muted cursor-pointer flex justify-between items-center group"
                                        onClick={() => handleSelect(item)}
                                    >
                                        <span>{item.name} <span className="text-xs text-muted-foreground">({item.length}m)</span></span>
                                        {item.weightPerPcKg && (
                                            <span className="text-xs text-muted-foreground">{item.weightPerPcKg} kg</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <Label htmlFor="length">Length (m)</Label>
                        <Select value={length} onValueChange={setLength}>
                            <SelectTrigger id="length" className="h-10">
                                <SelectValue placeholder="Select length" />
                            </SelectTrigger>
                            <SelectContent>
                                {AVAILABLE_LENGTHS.map((len) => (
                                    <SelectItem key={len} value={len.toString()}>
                                        {len}m
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="qty">Quantity</Label>
                        <Input id="qty" type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} required />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="weight">Weight (kg) <span className="text-muted-foreground text-xs">(Per Pc)</span></Label>
                        <Input id="weight" type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="0" />
                    </div>
                </div>

                <div className="pt-2 flex gap-2">
                    <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button type="submit" className="flex-1">Add Item</Button>
                </div>
            </form>
        </div>
    );
}

