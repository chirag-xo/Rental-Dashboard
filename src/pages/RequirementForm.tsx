import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { StepIndicator } from "@/components/StepIndicator";
import { Button } from "@/components/ui/button";
import { CategoryRow } from "@/components/CategoryRow";
import { usePersistence, type SelectionState } from "@/hooks/usePersistence";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { RefreshCcw, ArrowRight } from "lucide-react";
// import { toast } from "sonner"; // If we had a toast library, for now alert

import { useInventory } from "@/store/inventoryStore";
import { DirectItemAdder } from "@/components/DirectItemAdder";
import { type CustomItem } from "@/hooks/usePersistence";
import { v4 as uuidv4 } from "uuid";
// ... imports

export default function RequirementForm() {
    const navigate = useNavigate();
    const { data: persistentData, saveState, isLoaded: isPersistenceLoaded } = usePersistence();
    const { categories, loading: isInventoryLoading } = useInventory();
    const [selection, setSelection] = useState<SelectionState>({});
    const [directItems, setDirectItems] = useState<CustomItem[]>([]);

    const isLoaded = isPersistenceLoaded && !isInventoryLoading;

    // Load and merge persistence with dynamic categories
    useEffect(() => {
        if (isLoaded && categories.length > 0) {
            const initialSelection: SelectionState = {};

            // initialize all categories with default one item
            categories.forEach(cat => {
                const defaultMeter = cat.supportedLengths?.[0] || 30;
                // Array based: one default item
                initialSelection[cat.name] = [{
                    id: uuidv4(),
                    meter: defaultMeter,
                    qty: 0
                }];
            });

            // merge persisted data
            if (persistentData.selection && Object.keys(persistentData.selection).length > 0) {
                Object.entries(persistentData.selection).forEach(([key, val]) => {
                    // val is now SelectionItem[] due to migration in usePersistence
                    if (val && val.length > 0) {
                        initialSelection[key] = val;
                    }
                });
            }

            setSelection(initialSelection);
            // ...

            // Load direct items
            if (persistentData.directItems) {
                setDirectItems(persistentData.directItems);
            }
        }
    }, [isLoaded, persistentData.selection, persistentData.directItems, categories]);

    const handleUpdate = (category: string, id: string, field: "meter" | "qty", value: string) => {
        setSelection((prev) => {
            const catItems = prev[category] ? [...prev[category]] : [];
            const index = catItems.findIndex(i => i.id === id);

            if (index !== -1) {
                // Update item at index
                catItems[index] = {
                    ...catItems[index],
                    [field]: parseInt(value, 10) || 0,
                };
            }
            return { ...prev, [category]: catItems };
        });
    };

    const handleAddSize = (category: string) => {
        setSelection((prev) => {
            const catItems = prev[category] ? [...prev[category]] : [];
            // Default new item logic
            // Find category to get supported lengths default
            const catDef = categories.find(c => c.name === category);
            const defaultMeter = catDef?.supportedLengths?.[0] || 30;

            catItems.push({
                id: uuidv4(),
                meter: defaultMeter,
                qty: 1 // Helper: start with 1 qty when adding explicitly? or 0? 1 feels better UX.
            });

            return { ...prev, [category]: catItems };
        });
    };

    const handleRemoveSize = (category: string, id: string) => {
        setSelection((prev) => {
            const catItems = prev[category] ? prev[category].filter(i => i.id !== id) : [];

            // If all items removed, add back a default 0-qty item?
            // Or allow empty array? The UI should probably handle empty array by showing 
            // "No size selected" or auto-adding default. 
            // Let's enforce at least one item? Or allow true "removal".
            // If we allow true removal, user loop needs to handle empty array.
            // Let's default to preserving at least 1 item if user removes the last one, 
            // effectively resetting it.
            if (catItems.length === 0) {
                const catDef = categories.find(c => c.name === category);
                const defaultMeter = catDef?.supportedLengths?.[0] || 30;
                catItems.push({ id: uuidv4(), meter: defaultMeter, qty: 0 });
            }

            return { ...prev, [category]: catItems };
        });
    };

    // Direct Item Handlers
    const handleAddDirectItem = (item: CustomItem) => {
        const newItems = [...directItems, item];
        setDirectItems(newItems);
        // We defer saving to "Next" or allow auto-save?
        // Let's safe immediately to keep consistent UI state if user reloads
        // Actually saveState merges, so we need to be careful not to overwrite other fields if we only pass partial
        // But saveState docs say: const next = { ...prev, ...newState }; so it's a shallow merge of top level keys.
        // Good.
        // However, for performance, maybe just local state until "Next"? 
        // Plan says: "LocalStorage persistence must include... step1 direct items"
        // Let's save on Next to align with "Reset" logic or save immediately? 
        // "handeReset" clears everything.
        // Let's update local state only here, and save on "Next" or "Reset". 
        // But user expects persistence. The `useEffect` loads it.
        // If I reload page without clicking Next, I lose data if I don't save here.
        // So let's save.
        saveState({ directItems: newItems });
    };

    const handleRemoveDirectItem = (id: string) => {
        const newItems = directItems.filter(i => i.id !== id);
        setDirectItems(newItems);
        saveState({ directItems: newItems });
    };

    const handeReset = () => {
        if (confirm("Are you sure you want to reset the form?")) {
            const resetState: SelectionState = {};
            categories.forEach(cat => {
                const defaultMeter = cat.supportedLengths?.[0] || 30;
                resetState[cat.name] = [{
                    id: uuidv4(),
                    meter: defaultMeter,
                    qty: 0
                }];
            });
            setSelection(resetState);
            setDirectItems([]);
            // Cast to any if data types conflict temporarily, but PersistedData type in usePersistence handles it now.
            saveState({ selection: resetState, directItems: [] });
        }
    };

    const handleNext = () => {
        try {




            saveState({ selection, directItems });
            navigate("/review");
        } catch (error) {
            console.error("Navigation error:", error);
            alert("An error occurred during navigation. Please check the console or try Resetting the form.");
        }
    };

    if (!isLoaded) return <div className="p-8 text-center">Loading...</div>;

    return (
        <Layout title="Event Details" subtitle="Select your package requirements">
            <StepIndicator currentStep={1} />

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 pb-20"
            >
                {/* Direct Items Search */}
                <DirectItemAdder
                    items={directItems}
                    onAdd={handleAddDirectItem}
                    onRemove={handleRemoveDirectItem}
                />

                <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or Select Packages</span>
                    </div>
                </div>

                <div className="space-y-6">
                    {categories.map((cat) => (
                        <div key={cat.id} className="space-y-2">
                            {/* Loop through selections for this category */}
                            {Array.isArray(selection[cat.name]) && selection[cat.name].map((item) => (
                                <div key={item.id} className="relative group">
                                    <CategoryRow
                                        category={cat.name} // You might want to hide name for 2nd+ rows? 
                                        // Let's pass a prop to hide label if needed, or keep it simple.
                                        // keeping it simple: just render row.
                                        selectedMeter={item.meter.toString()}
                                        selectedQty={item.qty.toString()}
                                        validLengths={cat.supportedLengths}
                                        onMeterChange={(v) => handleUpdate(cat.name, item.id, "meter", v)}
                                        onQtyChange={(v) => handleUpdate(cat.name, item.id, "qty", v)}
                                    />
                                    {/* Remove Button for multi-row or even single row reset */}
                                    <div className="absolute right-2 top-2">
                                        {(selection[cat.name]?.length > 1 || item.qty > 0) && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                                onClick={() => handleRemoveSize(cat.name, item.id)}
                                                title="Remove size"
                                            >
                                                <span className="sr-only">Remove</span>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Add Size Button */}
                            <div className="flex justify-end px-2">
                                <Button
                                    variant="link"
                                    size="sm"
                                    className="text-xs text-primary h-auto py-1"
                                    onClick={() => handleAddSize(cat.name)}
                                >
                                    + Add another size
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-border flex gap-3 max-w-md mx-auto z-20">
                    <Button
                        variant="outline"
                        className="flex-1 h-12 border-muted-foreground/30"
                        onClick={handeReset}
                    >
                        <RefreshCcw className="mr-2 h-4 w-4" /> Reset
                    </Button>
                    <Button
                        className="flex-[2] h-12 bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={handleNext}
                    >
                        Next Step <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </motion.div>
        </Layout>
    );
}
