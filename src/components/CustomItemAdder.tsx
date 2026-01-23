import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { type CustomItem } from "@/hooks/usePersistence";
import { findItemWeight } from "@/data/packages";
import { useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

type CustomItemAdderProps = {
    onAdd: (item: CustomItem) => void;
};

export function CustomItemAdder({ onAdd }: CustomItemAdderProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState("");
    const [qty, setQty] = useState("1");
    const [weight, setWeight] = useState("");

    // Auto-lookup weight
    useEffect(() => {
        if (!name) return;
        const foundWeight = findItemWeight(name);
        if (foundWeight !== null) {
            setWeight(foundWeight.toString());
        }
    }, [name]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !qty) return;

        onAdd({
            id: uuidv4(),
            name,
            qty: parseInt(qty) || 1,
            weightPerPc: parseFloat(weight) || 0,
        });

        // Reset
        setName("");
        setQty("1");
        setWeight("");
        setIsOpen(false);
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
                <div className="space-y-1">
                    <Label htmlFor="name">Item Name</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Generator 5kW" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <Label htmlFor="qty">Quantity</Label>
                        <Input id="qty" type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} required />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="weight">Weight (kg) <span className="text-muted-foreground text-xs">(Optional)</span></Label>
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
