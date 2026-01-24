import { useEffect, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { StepIndicator } from "@/components/StepIndicator";
import { Button } from "@/components/ui/button";
import { ItemsTable } from "@/components/ItemsTable";
import { CustomItemAdder } from "@/components/CustomItemAdder";
import { usePersistence } from "@/hooks/usePersistence";
import { useInventory } from "@/store/inventoryStore";
import { calculateRequirements } from "@/utils/calculations";
import { generatePDF } from "@/utils/pdfGenerator";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export default function ReviewItems() {
    const navigate = useNavigate();
    const { data, saveState, isLoaded: isPersistenceLoaded } = usePersistence();
    const { categories, loading: isInventoryLoading } = useInventory();

    const isLoaded = isPersistenceLoaded && !isInventoryLoading;

    // Redirect if empty
    const hasSelection = useMemo(() => {
        if (!data.selection) return false;
        return Object.values(data.selection).some((s) => s.qty > 0);
    }, [data.selection]);

    useEffect(() => {
        if (isLoaded && !hasSelection) {
            navigate("/");
        }
    }, [isLoaded, hasSelection, navigate]);

    const { items, categoryTotals, grandTotalKnown, missingWeightCount } = useMemo(
        () => calculateRequirements(data.selection, data.customItems, categories, data.overrides),
        [data.selection, data.customItems, categories, data.overrides]
    );

    // Summary Text for PDF
    const summaryText = Object.entries(data.selection || {})
        .filter(([_, val]) => val.qty > 0)
        .map(([cat, val]) => `${cat} (${val.meter}m) x ${val.qty}`)
        .join(", ");

    const handleDownloadPDF = () => {
        generatePDF(items, grandTotalKnown, categoryTotals, summaryText);
    };

    const handeAddCustom = (item: any) => {
        saveState({ customItems: [...data.customItems, item] });
    };

    const handleUpdateQty = (name: string, qty: number) => {
        saveState({
            overrides: {
                ...data.overrides,
                [name]: {
                    ...data.overrides?.[name],
                    qty,
                },
            },
        });
    };

    if (!isLoaded || !hasSelection) return <div className="p-8 text-center">Loading...</div>;

    return (
        <Layout title="Review Requirements" subtitle="Verify items and generate report">
            <StepIndicator currentStep={2} />

            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6 pb-24"
            >
                {/* Summary Card */}
                <div className="bg-card border border-border p-4 rounded-xl shadow-sm space-y-3">
                    <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Selected Packages</h3>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(data.selection).map(([cat, val]) => {
                            if (val.qty === 0) return null;
                            return (
                                <div key={cat} className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-sm font-medium">
                                    {cat} {val.meter}m <span className="text-foreground/70">× {val.qty}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Totals Card */}
                <div className="bg-card border border-border p-4 rounded-xl shadow-sm flex flex-col items-center justify-center text-center space-y-1 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
                    <p className="text-muted-foreground text-xs uppercase tracking-widest font-semibold">Total Estimated Weight</p>
                    <p className="text-4xl font-bold tracking-tight text-foreground">{grandTotalKnown.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-lg font-normal text-muted-foreground">kg</span></p>

                    {missingWeightCount > 0 && (
                        <div className="flex items-center gap-1.5 text-primary bg-primary/10 px-3 py-1 rounded-full mt-2">
                            <AlertTriangle className="h-3 w-3" />
                            <span className="text-xs font-medium">{missingWeightCount} items missing weight</span>
                        </div>
                    )}
                </div>

                {/* Items Table */}
                <ItemsTable items={items} onUpdateQty={handleUpdateQty} />

                {/* Add Custom Item */}
                <CustomItemAdder onAdd={handeAddCustom} />

            </motion.div>

            {/* Floating Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-border flex gap-3 max-w-md mx-auto z-20">
                <Button
                    variant="ghost"
                    className="flex-1 h-12"
                    onClick={() => navigate("/")}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Edit
                </Button>
                <Button
                    className="flex-[2] h-12 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(212,175,55,0.3)] animate-pulse hover:animate-none"
                    onClick={handleDownloadPDF}
                >
                    <Download className="mr-2 h-4 w-4" /> Generate PDF
                </Button>
            </div>
        </Layout>
    );
}
