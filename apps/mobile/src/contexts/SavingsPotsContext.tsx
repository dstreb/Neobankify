import React, { createContext, useContext, useState, useCallback } from 'react';
import { INITIAL_POTS } from '../data/savingsPots';
import type { SavingsPot } from '../data/savingsPots';

// =====================================================
// Savings Pots Context
// =====================================================
// Shared state for savings pots so both DashboardScreen (summary)
// and SavingsPotsScreen (detail) always show the same data.
// In production, this would be backed by API calls to the
// savings-pots microservice.
// =====================================================

interface SavingsPotsContextType {
  pots: SavingsPot[];
  totalSaved: number;
  addPot: (pot: SavingsPot) => void;
  updatePot: (pot: SavingsPot) => void;
  deletePot: (potId: string) => void;
}

const SavingsPotsContext = createContext<SavingsPotsContextType | undefined>(undefined);

export function SavingsPotsProvider({ children }: { children: React.ReactNode }) {
  const [pots, setPots] = useState<SavingsPot[]>(INITIAL_POTS);

  const totalSaved = pots.reduce((sum, p) => sum + p.currentAmount, 0);

  const addPot = useCallback((pot: SavingsPot) => {
    setPots((prev) => [...prev, pot]);
  }, []);

  const updatePot = useCallback((updatedPot: SavingsPot) => {
    setPots((prev) => prev.map((p) => (p.id === updatedPot.id ? updatedPot : p)));
  }, []);

  const deletePot = useCallback((potId: string) => {
    setPots((prev) => prev.filter((p) => p.id !== potId));
  }, []);

  return (
    <SavingsPotsContext.Provider value={{ pots, totalSaved, addPot, updatePot, deletePot }}>
      {children}
    </SavingsPotsContext.Provider>
  );
}

export function useSavingsPots(): SavingsPotsContextType {
  const context = useContext(SavingsPotsContext);
  if (!context) {
    throw new Error('useSavingsPots must be used within a SavingsPotsProvider');
  }
  return context;
}
