'use client';
import { createContext, useContext, ReactNode, useState } from 'react';

interface DonationContextType {
  finishDonating: boolean;
  setFinishDonating: (value: boolean) => void;
}

const DonationContext = createContext<DonationContextType | undefined>(undefined);

export function DonationProvider({ children }: { children: ReactNode }) {
  const [finishDonating, setFinishDonating] = useState(false);

  return (
    <DonationContext.Provider value={{ finishDonating, setFinishDonating }}>
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
