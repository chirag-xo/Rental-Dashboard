import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { type InventoryItem } from "@/store/inventoryStore";
import { Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ItemSearchInputProps = {
    value: string;
    onChange: (val: string) => void;
    onSelect: (item: InventoryItem) => void;
    knownItems: InventoryItem[];
    placeholder?: string;
    className?: string;
};

export function ItemSearchInput({
    value,
    onChange,
    onSelect,
    knownItems,
    placeholder = "Item Name",
    className
}: ItemSearchInputProps) {
    const [suggestions, setSuggestions] = useState<InventoryItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);

    // Debounce search/filter
    useEffect(() => {
        if (value.trim().length < 2) {
            setSuggestions([]);
            setIsOpen(false);
            return;
        }

        const query = value.toLowerCase();
        // Filter unique items by name that match query
        // knownItems is already unique by name from store
        const matches = knownItems
            .filter(item => item.name.toLowerCase().includes(query))
            .slice(0, 5); // Limit to 5

        setSuggestions(matches);
        setIsOpen(matches.length > 0);
        setFocusedIndex(-1);
    }, [value, knownItems]);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setFocusedIndex(prev => (prev + 1) % suggestions.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setFocusedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        } else if (e.key === "Enter") {
            if (focusedIndex >= 0 && focusedIndex < suggestions.length) {
                e.preventDefault();
                handleSelect(suggestions[focusedIndex]);
            }
        } else if (e.key === "Escape") {
            setIsOpen(false);
        }
    };

    const handleSelect = (item: InventoryItem) => {
        onSelect(item);
        onChange(item.name); // Set input to full name
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value);
                        setIsOpen(true);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="pl-8 h-8 bg-background"
                />
            </div>

            <AnimatePresence>
                {isOpen && suggestions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground border border-border rounded-md shadow-md overflow-hidden text-xs"
                    >
                        <ul>
                            {suggestions.map((item, index) => (
                                <li
                                    key={item.id}
                                    onClick={() => handleSelect(item)}
                                    className={`px-3 py-2 cursor-pointer flex justify-between items-center
                                        ${index === focusedIndex ? "bg-accent text-accent-foreground" : "hover:bg-muted/50"}
                                    `}
                                >
                                    <span className="font-medium">{item.name}</span>
                                    {item.weightPerPcKg && (
                                        <span className="text-[10px] text-muted-foreground">
                                            {item.weightPerPcKg}kg
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
