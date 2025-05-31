import React, { createContext, useContext, useState, ReactNode } from "react";
import { WalletData } from "@/services/suiService";

interface WalletContextType {
  walletData: WalletData | null;
  setWalletData: (data: WalletData | null) => void;
  suiPrice: number | null;
  setSuiPrice: (price: number | null) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [suiPrice, setSuiPrice] = useState<number | null>(null);

  return (
    <WalletContext.Provider
      value={{ walletData, setWalletData, suiPrice, setSuiPrice }}
    >
      {children}
    </WalletContext.Provider>
  );
};
