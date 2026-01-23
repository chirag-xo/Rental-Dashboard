import React from "react";
import { cn } from "@/lib/utils";
import { Package } from "lucide-react";

type LayoutProps = {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    className?: string;
};

export function Layout({ children, title, subtitle, className }: LayoutProps) {
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
                    {/* <div className="text-xs text-muted-foreground">
             {new Date().toLocaleDateString()} 
          </div> */}
                </div>
            </header>

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
        </div>
    );
}
