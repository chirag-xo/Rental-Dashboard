import { useEffect, useRef, useCallback, useState } from 'react';

interface UseIdleTimerOptions {
    idleTimeout: number; // in milliseconds
    warningTime?: number; // Show warning X ms before logout
    onIdle: () => void;
    onWarning?: () => void;
    onActive?: () => void;
    disabled?: boolean;
}

export function useIdleTimer({
    idleTimeout,
    warningTime = 5 * 60 * 1000, // 5 minutes before timeout
    onIdle,
    onWarning,
    onActive,
    disabled = false
}: UseIdleTimerOptions) {
    const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [isWarning, setIsWarning] = useState(false);
    const [isIdle, setIsIdle] = useState(false);

    const clearTimers = useCallback(() => {
        if (idleTimerRef.current) {
            clearTimeout(idleTimerRef.current);
            idleTimerRef.current = null;
        }
        if (warningTimerRef.current) {
            clearTimeout(warningTimerRef.current);
            warningTimerRef.current = null;
        }
    }, []);

    const resetTimer = useCallback(() => {
        if (disabled) return;

        clearTimers();
        setIsWarning(false);
        setIsIdle(false);

        // Set warning timer
        if (onWarning && warningTime < idleTimeout) {
            warningTimerRef.current = setTimeout(() => {
                setIsWarning(true);
                onWarning();
            }, idleTimeout - warningTime);
        }

        // Set idle timer
        idleTimerRef.current = setTimeout(() => {
            setIsIdle(true);
            onIdle();
        }, idleTimeout);

        // Notify active if was previously warning
        if (onActive) {
            onActive();
        }
    }, [idleTimeout, warningTime, onIdle, onWarning, onActive, clearTimers, disabled]);

    // Activity events to track
    useEffect(() => {
        if (disabled) return;

        const activityEvents = [
            'mousemove',
            'mousedown',
            'keydown',
            'touchstart',
            'scroll',
            'click'
        ];

        // Handler for activity
        const handleActivity = () => {
            if (!isIdle) {
                resetTimer();
            }
        };

        // Visibility change handler (mobile-safe)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                // Check if we should have timed out while hidden
                resetTimer();
            }
        };

        // Add event listeners
        activityEvents.forEach(event => {
            document.addEventListener(event, handleActivity, { passive: true });
        });
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Initial timer start
        resetTimer();

        // Cleanup
        return () => {
            clearTimers();
            activityEvents.forEach(event => {
                document.removeEventListener(event, handleActivity);
            });
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [disabled, resetTimer, clearTimers, isIdle]);

    // Manual reset function (for "Continue" button in warning modal)
    const continueSession = useCallback(() => {
        resetTimer();
    }, [resetTimer]);

    return {
        isWarning,
        isIdle,
        continueSession,
        resetTimer
    };
}

// Constants for session timeouts
export const SESSION_CONSTANTS = {
    IDLE_TIMEOUT_MS: 30 * 60 * 1000,      // 30 minutes
    WARNING_TIME_MS: 5 * 60 * 1000,        // 5 minutes before timeout (show at 25 min)
    MAX_SESSION_MS: 8 * 60 * 60 * 1000,    // 8 hours
    MAX_SESSION_HOURS: 8
};
