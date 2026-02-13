import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
// import { type PackageCategory } from "@/data/packages"; // Unused now if we changed prop type to string, but let's keep it safe or remove if truly unused. Matches previous state.
// Actually I changed prop to string in previous step.
import { AVAILABLE_LENGTHS } from "@/store/inventoryStore";

type CategoryRowProps = {
    category: string; // Changed to string as it's just a name in usage
    selectedMeter: string;
    selectedQty: string;
    validLengths?: number[]; // Added prop
    onMeterChange: (val: string) => void;
    onQtyChange: (val: string) => void;
};

export function CategoryRow({
    category,
    selectedMeter,
    selectedQty,
    validLengths = AVAILABLE_LENGTHS, // Default fallback
    onMeterChange,
    onQtyChange,
}: CategoryRowProps) {
    // If current selection is invalid for this category, maybe show warning or auto-select?
    // For now, we trust parent to handle defaults, or user to select.

    return (
        <div className="bg-card/50 p-4 rounded-xl border border-border shadow-sm space-y-3">
            <div className="font-semibold text-lg text-primary">{category}</div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                        Size
                    </Label>
                    <Select value={selectedMeter} onValueChange={onMeterChange} disabled={validLengths.length <= 1}>
                        <SelectTrigger className="bg-background border-input/50 h-11">
                            <SelectValue placeholder="Size" />
                        </SelectTrigger>
                        <SelectContent>
                            {validLengths.map((m) => (
                                <SelectItem key={m} value={m.toString()}>
                                    {m}m
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                        Quantity
                    </Label>
                    <Input
                        type="number"
                        min="0"
                        placeholder="Qty"
                        value={selectedQty === "0" ? "" : selectedQty}
                        onChange={(e) => onQtyChange(e.target.value)}
                        className="bg-background border-input/50 h-11"
                    />
                </div>
            </div>
        </div>
    );
}
