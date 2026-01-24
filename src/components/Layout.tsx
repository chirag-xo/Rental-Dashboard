import React from "react";
import { cn } from "@/lib/utils";
import { Package, Settings, Calculator } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

type LayoutProps = {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    className?: string;
};

import { ModeToggle } from "@/components/mode-toggle";

export function Layout({ children, title, subtitle, className }: LayoutProps) {
    const location = useLocation();

    const navItems = [
        { label: "Calculator", path: "/", icon: Calculator },
        { label: "Manage Data", path: "/admin", icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
            <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-md border-b border-border shadow-sm">
                <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/20 p-2 rounded-lg">
                            <Package className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold leading-tight tracking-tight">
                                JD Rentals
                            </h1>
                            <p className="text-xs text-muted-foreground">
                                Premium Event Setup
                            </p>
                        </div>
                    </div>
                    <ModeToggle />
                </div>

                <nav className="flex gap-1 bg-muted/20 p-1 rounded-lg">
                    {navItems.map(item => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all",
                                    isActive
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <item.icon className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>
            </header >

            <main className={cn("flex-1 max-w-md mx-auto w-full px-4 py-6", className)}>
                {title && (
                    <div className="mb-6 space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">
                            {title}
                        </h2>
                        {subtitle && (
                            <p className="text-sm text-muted-foreground">{subtitle}</p>
                        )}
                    </div>
                )}
                {children}
            </main>

            <footer className="border-t border-border mt-auto bg-card/50">
                <div className="max-w-md mx-auto px-4 py-4 text-center">
                    <p className="text-xs text-muted-foreground/60">
                        &copy; {new Date().getFullYear()} JD Rentals. All rights reserved.
                    </p>
                </div>
            </footer>
        </div >
    );
}
