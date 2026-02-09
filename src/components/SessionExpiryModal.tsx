import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, LogOut } from "lucide-react";

interface SessionExpiryModalProps {
    isOpen: boolean;
    onContinue: () => void;
    onLogout: () => void;
    minutesRemaining?: number;
}

export function SessionExpiryModal({
    isOpen,
    onContinue,
    onLogout,
    minutesRemaining = 5
}: SessionExpiryModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                        <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <DialogTitle className="text-center">Session Expiring Soon</DialogTitle>
                    <DialogDescription className="text-center">
                        Your session will expire in approximately {minutesRemaining} minutes due to inactivity.
                        Would you like to continue working?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={onLogout}
                        className="gap-2"
                    >
                        <LogOut className="h-4 w-4" />
                        Logout Now
                    </Button>
                    <Button onClick={onContinue}>
                        Continue Working
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
