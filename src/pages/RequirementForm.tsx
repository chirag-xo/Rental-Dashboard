import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { StepIndicator } from "@/components/StepIndicator";
import { Button } from "@/components/ui/button";
import { CategoryRow } from "@/components/CategoryRow";
import { usePersistence, type SelectionState } from "@/hooks/usePersistence";
import { type PackageCategory } from "@/data/packages";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { RefreshCcw, ArrowRight } from "lucide-react";
// import { toast } from "sonner"; // If we had a toast library, for now alert

import { useInventory } from "@/store/inventoryStore";


export default function RequirementForm() {
    const navigate = useNavigate();
    const { data: persistentData, saveState, isLoaded: isPersistenceLoaded } = usePersistence();
    const { categories, loading: isInventoryLoading } = useInventory();
    const [selection, setSelection] = useState<SelectionState>({});

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
        }
    }, [isLoaded, persistentData.selection, categories]);

    const handleUpdate = (category: string, field: "meter" | "qty", value: string) => {
        setSelection((prev) => ({
            ...prev,
            [category]: {
                ...prev[category],
                [field]: parseInt(value, 10),
            },
        }));
    };

    const handeReset = () => {
        if (confirm("Are you sure you want to reset the form?")) {
            const resetState: SelectionState = {};
            categories.forEach(cat => {
                const defaultMeter = cat.supportedLengths?.[0] || 30;
                resetState[cat.name] = { meter: defaultMeter, qty: 0 };
            });
            setSelection(resetState);
            saveState({ selection: resetState });
        }
    };

    const handleNext = () => {
        // Validation: At least one item with qty > 0
        const hasSelection = Object.values(selection).some((s) => s.qty > 0);
        if (!hasSelection) {
            alert("Please select at least one package quantity.");
            return;
        }

        saveState({ selection });
        navigate("/review");
    };

    if (!isLoaded) return <div className="p-8 text-center">Loading...</div>;

    return (
        <Layout title="Event Details" subtitle="Select your package requirements">
            <StepIndicator currentStep={1} />

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 pb-20"
            >
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
