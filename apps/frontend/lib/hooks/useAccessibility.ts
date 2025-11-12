import { useEffect } from 'react';

/**
 * Custom hook to manage focus trap within a modal
 */
export function useFocusTrap(isActive: boolean, containerRef: React.RefObject<HTMLElement>) {
    useEffect(() => {
        if (!isActive || !containerRef.current) return;

        const container = containerRef.current;
        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        const handleTabKey = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement?.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement?.focus();
                }
            }
        };

        container.addEventListener('keydown', handleTabKey);
        firstElement?.focus();

        return () => {
            container.removeEventListener('keydown', handleTabKey);
        };
    }, [isActive, containerRef]);
}

/**
 * Custom hook for keyboard navigation
 */
export function useKeyboardNav(onEscape?: () => void, onEnter?: () => void) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && onEscape) {
                onEscape();
            }
            if (e.key === 'Enter' && onEnter) {
                onEnter();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onEscape, onEnter]);
}
