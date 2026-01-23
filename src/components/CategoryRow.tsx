import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { type PackageCategory } from "@/data/packages";

type CategoryRowProps = {
    category: PackageCategory;
    selectedMeter: string;
    selectedQty: string;
    onMeterChange: (val: string) => void;
    onQtyChange: (val: string) => void;
};

export function CategoryRow({
    category,
    selectedMeter,
    selectedQty,
    onMeterChange,
    onQtyChange,
}: CategoryRowProps) {
    return (
        <div className="bg-card/50 p-4 rounded-xl border border-border shadow-sm space-y-3">
            <div className="font-semibold text-lg text-primary">{category}</div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                        Size
                    </Label>
                    <Select value={selectedMeter} onValueChange={onMeterChange}>
                        <SelectTrigger className="bg-background border-input/50 h-11">
                            <SelectValue placeholder="Size" />
                        </SelectTrigger>
                        <SelectContent>
                            {[20, 30, 40, 50].map((m) => (
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
                    <Select value={selectedQty} onValueChange={onQtyChange}>
                        <SelectTrigger className="bg-background border-input/50 h-11">
                            <SelectValue placeholder="Qty" />
                        </SelectTrigger>
                        <SelectContent>
                            {[0, 1, 2, 3, 4, 5].map((q) => (
                                <SelectItem key={q} value={q.toString()}>
                                    {q === 0 ? "None" : q}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}
