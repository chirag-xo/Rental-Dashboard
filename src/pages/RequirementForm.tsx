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

const CATEGORIES: PackageCategory[] = ["Ring", "Bay", "Fabric", "Others", "Fasad"];

const INITIAL_STATE: SelectionState = {
    Ring: { meter: 30, qty: 0 },
    Bay: { meter: 30, qty: 0 },
    Fabric: { meter: 30, qty: 0 },
    Others: { meter: 30, qty: 0 },
    Fasad: { meter: 30, qty: 0 },
};

export default function RequirementForm() {
    const navigate = useNavigate();
    const { data, saveState, isLoaded } = usePersistence();
    const [selection, setSelection] = useState<SelectionState>(INITIAL_STATE);

    // Load from persistence once ready
    useEffect(() => {
        if (isLoaded && data.selection && Object.keys(data.selection).length > 0) {
            // Merge with initial to ensure all categories exist
            setSelection({ ...INITIAL_STATE, ...data.selection });
        }
    }, [isLoaded, data.selection]);

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
            setSelection(INITIAL_STATE);
            saveState({ selection: INITIAL_STATE });
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
                    {CATEGORIES.map((cat) => (
                        <CategoryRow
                            key={cat}
                            category={cat}
                            selectedMeter={selection[cat]?.meter?.toString() || "30"}
                            selectedQty={selection[cat]?.qty?.toString() || "0"}
                            onMeterChange={(v) => handleUpdate(cat, "meter", v)}
                            onQtyChange={(v) => handleUpdate(cat, "qty", v)}
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
