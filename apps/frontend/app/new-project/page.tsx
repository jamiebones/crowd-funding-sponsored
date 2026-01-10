'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useSearchParams } from 'next/navigation';
import { StepOne } from '@/components/create-campaign/StepOne';
import { StepTwo } from '@/components/create-campaign/StepTwo';
import { StepThree } from '@/components/create-campaign/StepThree';
import { Success } from '@/components/create-campaign/Success';
import { CheckCircle, Circle, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface CampaignFormData {
  // Step 1
  title: string;
  category: number;
  goal: string;
  duration: number;
  
  // Step 2
  description: string;
  files: File[];
  
  // Step 3
  arweaveTxId?: string;
  campaignAddress?: string;
  
  // Server wallet (if provided)
  serverWallet?: string;
}

export default function CreateCampaignPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const searchParams = useSearchParams();
  const serverWallet = searchParams.get('serverWallet');
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CampaignFormData>({
    title: '',
    category: 0,
    goal: '',
    duration: 30,
    description: '',
    files: [],
    serverWallet: serverWallet || undefined,
  });

  const steps = [
    { number: 1, title: 'Basic Info', description: 'Campaign details' },
    { number: 2, title: 'Content', description: 'Description & media' },
    { number: 3, title: 'Review', description: 'Confirm & submit' },
  ];

  const updateFormData = (data: Partial<CampaignFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const goToSuccess = (campaignAddress: string, arweaveTxId: string) => {
    updateFormData({ campaignAddress, arweaveTxId });
    setCurrentStep(4);
  };

  // Redirect if wallet not connected and no server wallet provided
  const requiresWallet = !serverWallet;
  
  if (requiresWallet && !isConnected) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <Circle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Connect Your Wallet
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              You need to connect your wallet to create a campaign
            </p>
            <button
              onClick={() => router.push('/')}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Go to Home
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Create a Campaign
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Launch your project and start raising funds
          </p>
        </div>

        {/* Server Wallet Banner */}
        {serverWallet && (
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Creating with Server Wallet
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 font-mono">
                  {serverWallet}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  This campaign will be created using a platform-managed wallet. No wallet connection required.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stepper */}
        {currentStep < 4 && (
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.number} className="flex-1">
                  <div className="flex items-center">
                    {/* Step Circle */}
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                        currentStep >= step.number
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {currentStep > step.number ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        step.number
                      )}
                    </div>

                    {/* Step Title */}
                    <div className="ml-3 flex-1">
                      <div
                        className={`text-sm font-medium ${
                          currentStep >= step.number
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {step.title}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                        {step.description}
                      </div>
                    </div>

                    {/* Connector Line */}
                    {index < steps.length - 1 && (
                      <div
                        className={`h-0.5 flex-1 mx-2 transition-colors ${
                          currentStep > step.number
                            ? 'bg-blue-600'
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form Steps */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 md:p-8">
          {currentStep === 1 && (
            <StepOne
              formData={formData}
              updateFormData={updateFormData}
              onNext={nextStep}
            />
          )}

          {currentStep === 2 && (
            <StepTwo
              formData={formData}
              updateFormData={updateFormData}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}

          {currentStep === 3 && (
            <StepThree
              formData={formData}
              onBack={prevStep}
              onSuccess={goToSuccess}
            />
          )}

          {currentStep === 4 && (
            <Success formData={formData} />
          )}
        </div>

        {/* Help Text */}
        {currentStep < 4 && (
          <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Need help?{' '}
            <a
              href="/about"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Learn how it works
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
