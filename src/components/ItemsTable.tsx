import { useMemo, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { type CalculatedItem, type PackageCategory } from "@/data/packages";
import { Search } from "lucide-react";

type ItemsTableProps = {
    items: CalculatedItem[];
    onUpdateQty?: (name: string, qty: number) => void;
};

export function ItemsTable({ items, onUpdateQty }: ItemsTableProps) {
    const [search, setSearch] = useState("");

    const filteredItems = useMemo(() => {
        return items.filter((item) =>
            item.name.toLowerCase().includes(search.toLowerCase())
        );
    }, [items, search]);

    // Group by Category
    const grouped = useMemo(() => {
        const groups: Partial<Record<PackageCategory | "Custom", CalculatedItem[]>> = {};
        filteredItems.forEach((item) => {
            const cat = item.category || "Others";
            if (!groups[cat]) groups[cat] = [];
            groups[cat]!.push(item);
        });
        return groups;
    }, [filteredItems]);

    const categories = Object.keys(grouped) as (PackageCategory | "Custom")[];

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search items..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-card border-border"
                />
            </div>

            <div className="rounded-md border border-border bg-card overlow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>Item Name</TableHead>
                            <TableHead className="text-center w-[60px]">Qty</TableHead>
                            <TableHead className="text-right w-[80px]">Wt/Pc</TableHead>
                            <TableHead className="text-right w-[80px]">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {categories.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    No items found.
                                </TableCell>
                            </TableRow>
                        )}

                        {categories.map((cat) => (
                            <>
                                <TableRow key={`header-${cat}`} className="bg-muted/30 hover:bg-muted/30">
                                    <TableCell colSpan={4} className="font-semibold text-primary py-2 text-xs uppercase tracking-wider">
                                        {cat}
                                    </TableCell>
                                </TableRow>
                                {grouped[cat]?.map((item, idx) => (
                                    <TableRow key={`${cat}-${idx}`}>
                                        <TableCell className="font-medium">
                                            {item.name}
                                            {(item as any).length && (
                                                <span className="text-muted-foreground text-xs ml-1">
                                                    ({(item as any).length}m)
                                                </span>
                                            )}
                                            {item.isCustom && (
                                                <Badge variant="outline" className="ml-2 text-[10px] h-4 px-1">
                                                    Custom
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {onUpdateQty ? (
                                                <Input
                                                    type="number"
                                                    className="h-8 w-16 text-center mx-auto"
                                                    value={item.qty.toString()}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value);
                                                        if (!isNaN(val) && val >= 0) {
                                                            onUpdateQty(item.name, val);
                                                        } else if (e.target.value === "") {
                                                            // Allow distinct empty -> 0 handling if typically supported, 
                                                            // but for now 0 safe.
                                                            onUpdateQty(item.name, 0);
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                item.qty
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground text-xs">
                                            {item.weightPerPc !== null ? item.weightPerPc.toFixed(2) : "-"}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {item.totalWeight !== null ? item.totalWeight.toFixed(2) : <span className="text-muted-foreground">-</span>}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
