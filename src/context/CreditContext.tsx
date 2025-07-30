"use client";

import React, { createContext, useState, useContext, ReactNode } from "react";

// Define the shape of the credits object
interface Credits {
  totalCredits: number;
  usedCredits: number;
}

// Define the shape of the context
interface CreditContextType {
  credits: Credits;
  updateCredits: (options: {
    totalCredits?: number;
    usedCredits?: number;
  }) => void;
}

// Create the context with an initial value
const CreditContext = createContext<CreditContextType | undefined>(undefined);

// Define the props for CreditProvider
interface CreditProviderProps {
  children: ReactNode;
}

export const CreditProvider: React.FC<CreditProviderProps> = ({ children }) => {
  const [credits, setCredits] = useState<Credits>({
    totalCredits: 0,
    usedCredits: 0,
  });

  const updateCredits = (options: {
    totalCredits?: number;
    usedCredits?: number;
  }) => {
    setCredits((prevCredits) => ({
      totalCredits:
        options.totalCredits !== undefined
          ? options.totalCredits
          : prevCredits.totalCredits,
      usedCredits:
        options.usedCredits !== undefined
          ? options.usedCredits
          : prevCredits.usedCredits,
    }));
  };

  return (
    <CreditContext.Provider value={{ credits, updateCredits }}>
      {children}
    </CreditContext.Provider>
  );
};

export const useCredits = (): CreditContextType => {
  const context = useContext(CreditContext);
  if (context === undefined) {
    throw new Error("useCredits must be used within a CreditProvider");
  }
  return context;
};
