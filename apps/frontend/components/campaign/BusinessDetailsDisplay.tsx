'use client';

import { useState, useEffect } from 'react';
import { 
    CampaignBusinessDetailsResponse, 
    BUSINESS_DETAILS_SECTIONS, 
    FIELD_LABELS 
} from '@/types/business-details';
import { 
    Users, 
    Info, 
    Package, 
    Target, 
    Compass, 
    Layers, 
    TrendingUp, 
    UserCheck,
    DollarSign,
    Users2,
    BarChart3,
    PiggyBank,
    LineChart,
    Banknote,
    ChevronDown,
    ChevronUp,
    Loader2,
    FileText,
    ExternalLink,
    AlertCircle
} from 'lucide-react';

interface BusinessDetailsDisplayProps {
    campaignAddress: string;
}

// Section icons mapping
const SECTION_ICONS: Record<string, React.ReactNode> = {
    TEAM: <Users className="w-5 h-5" />,
    OVERVIEW: <Info className="w-5 h-5" />,
    PRODUCT: <Package className="w-5 h-5" />,
    VALUE_PROPOSITION: <Target className="w-5 h-5" />,
    STRATEGY: <Compass className="w-5 h-5" />,
    DEVELOPMENT: <Layers className="w-5 h-5" />,
    MARKET: <TrendingUp className="w-5 h-5" />,
    CUSTOMERS: <UserCheck className="w-5 h-5" />,
    ECONOMICS: <DollarSign className="w-5 h-5" />,
    SEGMENTS: <Users2 className="w-5 h-5" />,
    REVENUE: <BarChart3 className="w-5 h-5" />,
    PROFITABILITY: <PiggyBank className="w-5 h-5" />,
    VALUATION: <LineChart className="w-5 h-5" />,
    FINANCING: <Banknote className="w-5 h-5" />,
};

// Format value for display
function formatValue(key: string, value: unknown): string {
    if (value === null || value === undefined || value === '') {
        return '—';
    }

    // Handle booleans
    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    }

    // Handle numbers with units based on field name
    if (typeof value === 'number') {
        if (key.includes('Billions')) {
            return `$${value.toLocaleString()}B`;
        }
        if (key.includes('Millions')) {
            return `$${value.toLocaleString()}M`;
        }
        if (key.includes('Thousands')) {
            return `$${value.toLocaleString()}K`;
        }
        if (key.includes('Percent')) {
            return `${value}%`;
        }
        if (key === 'ownership') {
            return `${value}%`;
        }
        if (key === 'cpaEst' || key === 'targetCPA' || key === 'aspEst' || key === 'targetASP' || key === 'cltv' || key === 'fcfEst' || key === 'ask2026') {
            return `$${value.toLocaleString()}`;
        }
        return value.toLocaleString();
    }

    return String(value);
}

// Check if a section has any data
function sectionHasData(
    details: CampaignBusinessDetailsResponse, 
    fields: readonly string[]
): boolean {
    return fields.some(field => {
        const value = details[field as keyof CampaignBusinessDetailsResponse];
        return value !== null && value !== undefined && value !== '';
    });
}

export function BusinessDetailsDisplay({ campaignAddress }: BusinessDetailsDisplayProps) {
    const [details, setDetails] = useState<CampaignBusinessDetailsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['TEAM', 'OVERVIEW', 'PRODUCT', 'VALUE_PROPOSITION']));

    useEffect(() => {
        async function fetchDetails() {
            try {
                setLoading(true);
                setError(null);
                
                const response = await fetch(
                    `/api/campaign-business-details?campaignAddress=${campaignAddress.toLowerCase()}`
                );
                
                if (response.status === 404) {
                    // No business details yet - this is not an error
                    setDetails(null);
                    return;
                }
                
                if (!response.ok) {
                    throw new Error('Failed to load business details');
                }
                
                const data = await response.json();
                setDetails(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        }

        if (campaignAddress) {
            fetchDetails();
        }
    }, [campaignAddress]);

    const toggleSection = (sectionKey: string) => {
        setExpandedSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(sectionKey)) {
                newSet.delete(sectionKey);
            } else {
                newSet.add(sectionKey);
            }
            return newSet;
        });
    };

    const expandAll = () => {
        setExpandedSections(new Set(Object.keys(BUSINESS_DETAILS_SECTIONS)));
    };

    const collapseAll = () => {
        setExpandedSections(new Set());
    };

    // Loading state
    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Business Plan</h2>
                </div>
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                    <span className="ml-2 text-gray-600 dark:text-gray-400">Loading business details...</span>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Business Plan</h2>
                </div>
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                </div>
            </div>
        );
    }

    // No business details available
    if (!details) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Business Plan</h2>
                </div>
                <p className="text-gray-500 dark:text-gray-400 italic">
                    The campaign owner has not submitted a business plan yet.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Business Plan</h2>
                    {details.urgent && (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                            Urgent
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={expandAll}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        Expand All
                    </button>
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                    <button
                        onClick={collapseAll}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        Collapse All
                    </button>
                </div>
            </div>

            {/* Intro Video if available */}
            {details.introVideo && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <a
                        href={details.introVideo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Watch Introduction Video
                    </a>
                </div>
            )}

            {/* Wish/Dream/Prayer highlight */}
            {details.wishDreamPrayer && (
                <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
                    <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-2">
                        Vision & Mission
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 italic">
                        &ldquo;{details.wishDreamPrayer}&rdquo;
                    </p>
                </div>
            )}

            {/* Sections */}
            <div className="space-y-4">
                {Object.entries(BUSINESS_DETAILS_SECTIONS).map(([sectionKey, section]) => {
                    const hasData = sectionHasData(details, section.fields);
                    if (!hasData) return null;

                    const isExpanded = expandedSections.has(sectionKey);

                    return (
                        <div
                            key={sectionKey}
                            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                        >
                            {/* Section Header */}
                            <button
                                onClick={() => toggleSection(sectionKey)}
                                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-blue-600 dark:text-blue-400">
                                        {SECTION_ICONS[sectionKey]}
                                    </span>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                        {section.title}
                                    </h3>
                                </div>
                                {isExpanded ? (
                                    <ChevronUp className="w-5 h-5 text-gray-500" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-gray-500" />
                                )}
                            </button>

                            {/* Section Content */}
                            {isExpanded && (
                                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {section.fields.map(field => {
                                        const value = details[field as keyof CampaignBusinessDetailsResponse];
                                        if (value === null || value === undefined || value === '') {
                                            return null;
                                        }

                                        const label = FIELD_LABELS[field as keyof typeof FIELD_LABELS] || field;
                                        const displayValue = formatValue(field, value);

                                        return (
                                            <div key={field} className="flex flex-col">
                                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                                    {label}
                                                </span>
                                                <span className="text-gray-900 dark:text-white font-medium">
                                                    {displayValue}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Highlights if available */}
            {details.highlights && (
                <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-100 dark:border-yellow-800">
                    <h3 className="text-sm font-semibold text-yellow-700 dark:text-yellow-300 mb-2">
                        Key Highlights
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {details.highlights}
                    </p>
                </div>
            )}

            {/* Last updated */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Last updated: {new Date(details.updatedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    })}
                </p>
            </div>
        </div>
    );
}
