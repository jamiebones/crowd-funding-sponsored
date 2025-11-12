import dynamic from 'next/dynamic';
import { ComponentType, ReactNode } from 'react';

/**
 * Lazy load heavy components with loading fallback
 */
export function lazyLoad<T extends ComponentType<any>>(
    importFunc: () => Promise<{ default: T }>,
    fallback?: ReactNode
) {
    return dynamic(importFunc, {
        loading: () => (fallback as any) || null,
        ssr: false,
    });
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;

    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            timeout = null;
            func(...args);
        };

        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function for scroll events
 */
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean = false;

    return function executedFunction(...args: Parameters<T>) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }
    };
}
