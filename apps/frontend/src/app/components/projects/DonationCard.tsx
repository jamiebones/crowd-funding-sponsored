import { useState, useEffect } from 'react';
import { useDonation } from '../../../context/donationContext';

const SUGGESTED_AMOUNTS = [0.1, 0.05, 0.01, 0.005];

export const DonationCard = ({ onDonate, isPending }: { onDonate: (amount: number) => void, isPending: boolean }) => {
  const [customAmount, setCustomAmount] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const { finishDonating } = useDonation();
  
  
  const handleDonate = () => {
    alert("Donating...");
    const amount = selectedAmount || parseFloat(customAmount);
    if (amount > 0) {
      onDonate(amount);
    }
  };

  useEffect(() => {
    if (finishDonating) {
      setSelectedAmount(null);
      setCustomAmount('');
    }
  }, [finishDonating]);
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
      <h2 className="text-2xl font-bold mb-6">Support this Project</h2>
      
      {/* Suggested amounts */}
      <div className="flex gap-3 mb-6">
        {SUGGESTED_AMOUNTS.map((amount) => (
          <button
            key={amount}
            onClick={() => {
              setSelectedAmount(amount);
              setCustomAmount('');
            }}
            className={`
              flex-1 py-3 px-4 rounded-xl font-medium transition-all
              ${selectedAmount === amount 
                ? 'bg-purple-600 text-white' 
                : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
              }
            `}
          >
            {amount} 
          </button>
        ))}
      </div>

      {/* Custom amount input */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="number"
            value={customAmount}
            onChange={(e) => {
              setCustomAmount(e.target.value);
              setSelectedAmount(null);
            }}
            placeholder="Enter custom amount"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
            BNB
          </span>
        </div>
      </div>

      {/* Donate button */}
      <p>{isPending ? 'Donating...' : 'Donate Now'}</p>
      <button
        onClick={()=>handleDonate()}
        disabled={isPending}
        className={`
          w-full py-4 px-6 rounded-xl font-semibold text-white transition-all
          ${(!selectedAmount && !customAmount)
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
          }
        `}
      >
        {isPending ? 'Donating...' : 'Donate Now'}
      </button>
    </div>
  );
}; 