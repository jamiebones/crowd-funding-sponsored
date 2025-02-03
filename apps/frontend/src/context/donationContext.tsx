'use client';
import { createContext, useContext, ReactNode, useState } from 'react';

interface DonationContextType {
  finishDonating: boolean;
  setFinishDonating: (value: boolean) => void;
  startVoting: boolean;
  setStartVoting: (value: boolean) => void;
  withdrawMilestone: boolean;
  setWithdrawMilestone: (value: boolean) => void;

}

const DonationContext = createContext<DonationContextType | undefined>(undefined);

export function DonationProvider({ children }: { children: ReactNode }) {
  const [finishDonating, setFinishDonating] = useState(false);
  const [startVoting, setStartVoting] = useState(false);
  const [withdrawMilestone, setWithdrawMilestone] = useState(false);

  return (
    <DonationContext.Provider value={{ finishDonating, setFinishDonating, startVoting, setStartVoting, withdrawMilestone, setWithdrawMilestone }}>
      {children}
    </DonationContext.Provider>
  );
}

export function useDonation() {
  const context = useContext(DonationContext);
  if (context === undefined) {
    throw new Error('useDonation must be used within a DonationProvider');
  }
  return context;
}
