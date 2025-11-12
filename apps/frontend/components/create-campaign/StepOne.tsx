import { CATEGORIES } from '@/lib/constants';
import { CampaignFormData } from '@/app/new-project/page';
import { useState } from 'react';
import { AlertCircle } from 'lucide-react';

interface StepOneProps {
  formData: CampaignFormData;
  updateFormData: (data: Partial<CampaignFormData>) => void;
  onNext: () => void;
}

export function StepOne({ formData, updateFormData, onNext }: StepOneProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Campaign title is required';
    } else if (formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    const goalNum = parseFloat(formData.goal);
    if (!formData.goal || isNaN(goalNum)) {
      newErrors.goal = 'Funding goal is required';
    } else if (goalNum < 0.01) {
      newErrors.goal = 'Minimum goal is 0.01 BNB';
    } else if (goalNum > 1000000) {
      newErrors.goal = 'Maximum goal is 1,000,000 BNB';
    }

    if (formData.duration < 1 || formData.duration > 365) {
      newErrors.duration = 'Duration must be between 1 and 365 days';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Basic Information
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Tell us about your campaign
        </p>
      </div>

      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Campaign Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => updateFormData({ title: e.target.value })}
          className={`w-full px-4 py-3 border rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.title
              ? 'border-red-500'
              : 'border-gray-300 dark:border-gray-600'
          }`}
          placeholder="My Amazing Project"
          maxLength={100}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.title}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {formData.title.length}/100 characters
        </p>
      </div>

      {/* Category */}
      <div>
        <label
          htmlFor="category"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Category <span className="text-red-500">*</span>
        </label>
        <select
          id="category"
          value={formData.category}
          onChange={(e) => updateFormData({ category: parseInt(e.target.value) })}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Goal */}
        <div>
          <label
            htmlFor="goal"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Funding Goal (BNB) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="goal"
            value={formData.goal}
            onChange={(e) => updateFormData({ goal: e.target.value })}
            step="0.01"
            min="0.01"
            max="1000000"
            className={`w-full px-4 py-3 border rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.goal
                ? 'border-red-500'
                : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="10.0"
          />
          {errors.goal && (
            <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.goal}
            </p>
          )}
          {formData.goal && !errors.goal && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              ≈ ${(parseFloat(formData.goal) * 600).toLocaleString()} USD
            </p>
          )}
        </div>

        {/* Duration */}
        <div>
          <label
            htmlFor="duration"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Campaign Duration (Days) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="duration"
            value={formData.duration}
            onChange={(e) => updateFormData({ duration: parseInt(e.target.value) })}
            min="1"
            max="365"
            className={`w-full px-4 py-3 border rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.duration
                ? 'border-red-500'
                : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {errors.duration && (
            <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.duration}
            </p>
          )}
          {formData.duration && !errors.duration && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Ends on{' '}
              {new Date(
                Date.now() + formData.duration * 24 * 60 * 60 * 1000
              ).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
          💡 Campaign Tips
        </h4>
        <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
          <li>• Choose a clear, compelling title that describes your project</li>
          <li>• Set a realistic funding goal based on your actual needs</li>
          <li>• Longer campaigns give you more time, but may reduce urgency</li>
          <li>• You can end your campaign early if you reach your goal</li>
        </ul>
      </div>

      {/* Navigation */}
      <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          type="submit"
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
        >
          Continue to Content →
        </button>
      </div>
    </form>
  );
}
