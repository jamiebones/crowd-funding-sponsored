'use client';

import { useState, useEffect } from 'react';
import { useBusinessDetails } from '@/lib/hooks/useBusinessDetails';
import { useCampaignOwner } from '@/lib/hooks/useCampaignOwner';
import { CampaignBusinessDetailsInput, BUSINESS_DETAILS_SECTIONS, FIELD_LABELS } from '@/types/business-details';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Save, AlertCircle, CheckCircle, Search, Loader2, Shield } from 'lucide-react';

interface BusinessDetailsFormProps {
    campaignAddress?: string;
    ownerAddress: string;
    isAdmin?: boolean;
    onSuccess?: () => void;
}

export function BusinessDetailsForm({ campaignAddress: initialCampaign, ownerAddress, isAdmin, onSuccess }: BusinessDetailsFormProps) {
    const { businessDetails, createBusinessDetails, updateBusinessDetails, loading: hookLoading } = useBusinessDetails({
        campaignAddress: initialCampaign,
        autoFetch: !!initialCampaign
    });
    
    const [currentStep, setCurrentStep] = useState(0);
    const [isUpdating, setIsUpdating] = useState(false);
    const [campaignAddress, setCampaignAddress] = useState(initialCampaign || '');
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    // Verify campaign ownership
    const { isOwner, isLoading: ownershipLoading, isError: ownershipError } = useCampaignOwner({
        campaignAddress: campaignAddress || initialCampaign,
        userAddress: ownerAddress,
    });
    
    const [formData, setFormData] = useState<Partial<CampaignBusinessDetailsInput>>({
        campaignAddress: initialCampaign || '',
        ownerAddress,
        urgent: false,
    });

    // Populate form with existing data if available
    useEffect(() => {
        if (businessDetails && initialCampaign) {
            setFormData(businessDetails);
            setIsUpdating(true);
        }
    }, [businessDetails, initialCampaign]);

    const sections = Object.entries(BUSINESS_DETAILS_SECTIONS);
    const [sectionKey, sectionData] = sections[currentStep];

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const validateCurrentStep = () => {
        const newErrors: Record<string, string> = {};
        const requiredFields = ['who1', 'what1', 'why1', 'how', 'where', 'when', 'concept', 'strategies'];
        
        sectionData.fields.forEach(field => {
            if (requiredFields.includes(field) && !formData[field as keyof CampaignBusinessDetailsInput]) {
                newErrors[field] = `${FIELD_LABELS[field as keyof typeof FIELD_LABELS]} is required`;
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateCurrentStep() && currentStep < sections.length - 1) {
            setCurrentStep(prev => prev + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate campaign address
        if (!campaignAddress || !campaignAddress.startsWith('0x')) {
            toast.error('Please enter a valid campaign address');
            setErrors({ campaignAddress: 'Valid campaign address is required' });
            return;
        }

        // Validate all required fields
        const requiredFields = ['who1', 'what1', 'why1', 'how', 'where', 'when', 'concept', 'strategies'];
        const missingFields: string[] = [];
        
        requiredFields.forEach(field => {
            if (!formData[field as keyof CampaignBusinessDetailsInput]) {
                missingFields.push(FIELD_LABELS[field as keyof typeof FIELD_LABELS]);
            }
        });

        if (missingFields.length > 0) {
            toast.error(`Please fill in required fields: ${missingFields.join(', ')}`);
            return;
        }

        try {
            const data = {
                ...formData,
                campaignAddress: campaignAddress.toLowerCase(),
                ownerAddress: ownerAddress.toLowerCase(),
            } as CampaignBusinessDetailsInput;
            
            if (isUpdating) {
                await updateBusinessDetails(data);
                toast.success('Business details updated successfully!');
            } else {
                await createBusinessDetails(data);
                toast.success('Business details created successfully!');
            }
            
            onSuccess?.();
        } catch (error: any) {
            const errorMessage = error?.message || 'Failed to save business details';
            toast.error(errorMessage);
            console.error(error);
        }
    };

    const renderField = (fieldName: string) => {
        const label = FIELD_LABELS[fieldName as keyof typeof FIELD_LABELS];
        const value = formData[fieldName as keyof CampaignBusinessDetailsInput];
        const error = errors[fieldName];
        const requiredFields = ['who1', 'what1', 'why1', 'how', 'where', 'when', 'concept', 'strategies'];
        const isRequired = requiredFields.includes(fieldName);

        // Boolean field
        if (fieldName === 'urgent') {
            return (
                <div key={fieldName} className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <input
                        type="checkbox"
                        id={fieldName}
                        checked={value as boolean || false}
                        onChange={(e) => handleInputChange(fieldName, e.target.checked)}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor={fieldName} className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                        {label}
                    </label>
                </div>
            );
        }

        // Number fields
        if (
            fieldName.includes('Billions') ||
            fieldName.includes('Millions') ||
            fieldName.includes('Thousands') ||
            fieldName.includes('Est') ||
            fieldName.includes('Percent') ||
            fieldName.includes('cpa') ||
            fieldName.includes('asp') ||
            fieldName.includes('cltv') ||
            fieldName.includes('value') ||
            fieldName === 'rank' ||
            fieldName === 'ownership' ||
            fieldName.includes('entrepreneurs') ||
            fieldName === 'ask2026'
        ) {
            return (
                <div key={fieldName} className="space-y-2">
                    <label htmlFor={fieldName} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {label} {isRequired && <span className="text-red-500">*</span>}
                    </label>
                    <input
                        id={fieldName}
                        type="number"
                        value={value as number || ''}
                        onChange={(e) => handleInputChange(fieldName, e.target.value ? parseFloat(e.target.value) : undefined)}
                        className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        step="any"
                        placeholder="0"
                    />
                    {error && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </p>
                    )}
                </div>
            );
        }

        // Textarea for longer text fields
        if (
            fieldName.includes('why') ||
            fieldName.includes('what') ||
            fieldName === 'how' ||
            fieldName === 'concept' ||
            fieldName === 'strategies' ||
            fieldName === 'wishDreamPrayer' ||
            fieldName === 'highlights' ||
            fieldName === 'offer2026'
        ) {
            return (
                <div key={fieldName} className="space-y-2">
                    <label htmlFor={fieldName} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {label} {isRequired && <span className="text-red-500">*</span>}
                    </label>
                    <textarea
                        id={fieldName}
                        value={value as string || ''}
                        onChange={(e) => handleInputChange(fieldName, e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                            error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        rows={4}
                        placeholder={`Enter ${label.toLowerCase()}...`}
                    />
                    {error && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </p>
                    )}
                </div>
            );
        }

        // Default text input
        return (
            <div key={fieldName} className="space-y-2">
                <label htmlFor={fieldName} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {label} {isRequired && <span className="text-red-500">*</span>}
                </label>
                <input
                    id={fieldName}
                    type="text"
                    value={value as string || ''}
                    onChange={(e) => handleInputChange(fieldName, e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder={`Enter ${label.toLowerCase()}...`}
                />
                {error && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </p>
                )}
            </div>
        );
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg">
            {/* Campaign Address Input (if not provided) */}
            {!initialCampaign && (
                <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                    <label htmlFor="campaignAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Campaign Address <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <input
                                id="campaignAddress"
                                type="text"
                                value={campaignAddress}
                                onChange={(e) => {
                                    setCampaignAddress(e.target.value);
                                    setFormData(prev => ({ ...prev, campaignAddress: e.target.value }));
                                }}
                                className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.campaignAddress ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                }`}
                                placeholder="0x..."
                            />
                            <Search className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
                        </div>
                    </div>
                    {errors.campaignAddress && (
                        <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            {errors.campaignAddress}
                        </p>
                    )}
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Enter the campaign contract address you want to add business details for.
                    </p>
                </div>
            )}

            {/* Progress indicator */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Step {currentStep + 1} of {sections.length}
                    </span>
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {Math.round(((currentStep + 1) / sections.length) * 100)}% Complete
                    </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${((currentStep + 1) / sections.length) * 100}%` }}
                    />
                </div>
                
                {/* Step indicators */}
                <div className="flex justify-between mt-4 overflow-x-auto">
                    {sections.map(([key, section], index) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setCurrentStep(index)}
                            className={`flex-1 text-xs py-2 px-1 transition-colors min-w-[60px] ${
                                index === currentStep
                                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                                    : index < currentStep
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-gray-400 dark:text-gray-500'
                            }`}
                        >
                            {index < currentStep && <CheckCircle className="w-4 h-4 inline mr-1" />}
                            <span className="hidden sm:inline">{section.title}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
                {/* Ownership Verification */}
                {campaignAddress && !isAdmin && (
                    <div className="p-4 mb-4 border-b border-gray-200 dark:border-gray-700">
                        {ownershipLoading ? (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm">Verifying campaign ownership...</span>
                            </div>
                        ) : ownershipError ? (
                            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-sm">Error verifying campaign ownership</span>
                            </div>
                        ) : isOwner ? (
                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-sm font-medium">Campaign ownership verified ✓</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                                <Shield className="w-5 h-5" />
                                <div className="flex-1">
                                    <p className="text-sm font-semibold">Unauthorized Access</p>
                                    <p className="text-xs mt-1">You are not the owner of this campaign. Only the campaign owner can add or edit business details.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="p-6 space-y-6">
                    {/* Section title */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            {sectionData.title}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            {currentStep === 0 && 'Who is behind this project?'}
                            {currentStep === 1 && 'Provide overview information'}
                            {currentStep === 2 && 'What are you building?'}
                            {currentStep === 3 && 'Why does this matter?'}
                            {currentStep === 4 && 'How will you execute?'}
                            {currentStep === 5 && 'What stage is your project at?'}
                            {currentStep === 6 && 'How big is your market?'}
                            {currentStep === 7 && 'What are your customer metrics?'}
                            {currentStep === 8 && 'What are your unit economics?'}
                            {currentStep === 9 && 'Who are your target segments?'}
                            {currentStep === 10 && 'What are your revenue projections?'}
                            {currentStep === 11 && 'What are your profitability metrics?'}
                            {currentStep === 12 && 'What is your projected valuation?'}
                            {currentStep === 13 && 'What funding are you seeking?'}
                        </p>
                    </div>

                    {/* Form fields for current section */}
                    <div className="space-y-6">
                        {sectionData.fields.map(field => renderField(field))}
                    </div>
                </div>

                {/* Navigation buttons */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-between gap-4">
                    <button
                        type="button"
                        onClick={handlePrevious}
                        disabled={currentStep === 0}
                        className="flex items-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                    </button>

                    {currentStep < sections.length - 1 ? (
                        <button
                            type="button"
                            onClick={handleNext}
                            disabled={!!campaignAddress && !isAdmin && !isOwner}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={hookLoading || (!!campaignAddress && !isAdmin && !isOwner)}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {hookLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    {isUpdating ? 'Update Business Details' : 'Submit Business Details'}
                                </>
                            )}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}

export default BusinessDetailsForm;
