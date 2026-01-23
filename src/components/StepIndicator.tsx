import { cn } from "@/lib/utils";

type StepIndicatorProps = {
    currentStep: 1 | 2;
    totalSteps?: number;
};

export function StepIndicator({ currentStep, totalSteps = 2 }: StepIndicatorProps) {
    return (
        <div className="flex items-center gap-2 mb-6">
            <div className="flex gap-1 flex-1">
                {Array.from({ length: totalSteps }).map((_, i) => {
                    const step = i + 1;
                    const isActive = step <= currentStep;
                    return (
                        <div
                            key={step}
                            className={cn(
                                "h-1.5 flex-1 rounded-full transition-all duration-300",
                                isActive ? "bg-primary" : "bg-muted"
                            )}
                        />
                    );
                })}
            </div>
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                Step {currentStep} / {totalSteps}
            </span>
        </div>
    );
}
