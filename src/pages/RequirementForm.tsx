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

export default function RequirementForm() {
    const navigate = useNavigate();
    const { data: persistentData, saveState, isLoaded: isPersistenceLoaded } = usePersistence();
    const { categories, loading: isInventoryLoading } = useInventory();
    const [selection, setSelection] = useState<SelectionState>({});
    const [directItems, setDirectItems] = useState<CustomItem[]>([]);

    const isLoaded = isPersistenceLoaded && !isInventoryLoading;

    // Load from persistence once ready
    // Load and merge persistence with dynamic categories
    useEffect(() => {
        if (isLoaded && categories.length > 0) {
            const initialSelection: SelectionState = {};

            // initialize all categories with default 0
            categories.forEach(cat => {
                const defaultMeter = cat.supportedLengths?.[0] || 30;
                initialSelection[cat.name] = { meter: defaultMeter, qty: 0 };
            });

            // merge persisted data
            if (persistentData.selection && Object.keys(persistentData.selection).length > 0) {
                Object.entries(persistentData.selection).forEach(([key, val]) => {
                    if (initialSelection[key]) {
                        initialSelection[key] = val;
                    }
                });
            }

            setSelection(initialSelection);

            // Load direct items
            if (persistentData.directItems) {
                setDirectItems(persistentData.directItems);
            }
        }
    }, [isLoaded, persistentData.selection, persistentData.directItems, categories]);

    const handleUpdate = (category: string, field: "meter" | "qty", value: string) => {
        setSelection((prev) => ({
            ...prev,
            [category]: {
                ...prev[category],
                [field]: parseInt(value, 10),
            },
        }));
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
                resetState[cat.name] = { meter: defaultMeter, qty: 0 };
            });
            setSelection(resetState);
            setDirectItems([]);
            saveState({ selection: resetState, directItems: [] });
        }
    };

    const handleNext = () => {
        // Validation: At least one item with qty > 0 OR one direct item
        const hasSelection = Object.values(selection).some((s) => s.qty > 0);
        const hasDirectItems = directItems.length > 0;

        if (!hasSelection && !hasDirectItems) {
            alert("Please select at least one package quantity OR add a direct item.");
            return;
        }

        saveState({ selection, directItems });
        navigate("/review");
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

                <div className="space-y-4">
                    {categories.map((cat) => (
                        <CategoryRow
                            key={cat.id}
                            category={cat.name}
                            selectedMeter={selection[cat.name]?.meter?.toString() || (cat.supportedLengths?.[0]?.toString() || "30")}
                            selectedQty={selection[cat.name]?.qty?.toString() || "0"}
                            validLengths={cat.supportedLengths}
                            onMeterChange={(v) => handleUpdate(cat.name, "meter", v)}
                            onQtyChange={(v) => handleUpdate(cat.name, "qty", v)}
                        />
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
