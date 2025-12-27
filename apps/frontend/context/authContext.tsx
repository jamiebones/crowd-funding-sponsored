'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAccount } from 'wagmi';
import { initWeb3Auth, getWeb3Auth, resetWeb3Auth } from '@/lib/auth/web3auth-config';
import { setWalletMode, getWalletMode, getWalletAddress } from '@/lib/auth/wallet-provider';
import type { WalletMode } from '@/lib/auth/wallet-provider';


interface UserInfo {
  email?: string;
  name?: string;
  profileImage?: string;
  provider?: string;
  verifierId?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  walletMode: WalletMode;
  walletAddress: string | null;
  userInfo: UserInfo | null;
  isLoading: boolean;
  loginWithSocial: (provider?: string) => Promise<void>;
  loginWithWeb3: () => Promise<void>;
  logout: () => Promise<void>;
  switchWalletMode: (mode: WalletMode) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [walletMode, setWalletModeState] = useState<WalletMode>('web3');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize authentication state on mount (runs once)
  useEffect(() => {
    const initAuth = async () => {
      try {
        const mode = getWalletMode();
        setWalletModeState(mode);

        if (mode === 'social') {
          // Initialize Web3Auth and check if user is already logged in
          const web3auth = await initWeb3Auth();
          if (web3auth.connected) {
            const address = await getWalletAddress();
            const info = await web3auth.getUserInfo() as any;
            setIsAuthenticated(true);
            setWalletAddress(address);
            setUserInfo({
              email: info.email,
              name: info.name,
              profileImage: info.profileImage,
              provider: info.typeOfLogin || 'unknown',
              verifierId: info.verifierId || '',
            });
          }
        } else {
          // For web3 mode, check if there's an existing session
          try {
            const response = await fetch('/api/users/profile');
            if (response.ok) {
              const data = await response.json();
              if (data.user) {
                setWalletAddress(data.user.walletAddress);
                setUserInfo({
                  email: data.user.email,
                  name: data.user.name,
                  profileImage: data.user.profileImage,
                  provider: data.user.provider,
                });
              }
            }
          } catch (err) {
            // No existing session, that's fine
            console.log('No existing session found');
          }
        }
        // Note: Web3 wallet state is handled by the wagmi sync effect below
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Sync with wagmi account changes (runs when wagmi connection state changes)
  useEffect(() => {
    if (wagmiConnected && wagmiAddress) {
      // Web3 wallet connected - switch to web3 mode
      setWalletMode('web3');
      setWalletModeState('web3');
      setIsAuthenticated(true);
      setWalletAddress(wagmiAddress);
      setUserInfo(null); // Web3 wallets don't have user info
    } else if (!wagmiConnected && walletMode === 'web3') {
      // Web3 wallet disconnected (only clear if in web3 mode)
      setIsAuthenticated(false);
      setWalletAddress(null);
      setUserInfo(null);
    }
  }, [wagmiAddress, wagmiConnected, walletMode]);

  const loginWithSocial = async (provider?: string) => {
    try {
      setIsLoading(true);
      const web3auth = await initWeb3Auth();
      // Connect with Web3Auth
      const web3authProvider = await web3auth.connect();
      if (!web3authProvider) {
        throw new Error('Failed to connect with Web3Auth');
      }

      // Get user info and wallet address
      const address = await getWalletAddress();
      const info = await web3auth.getUserInfo() as any;

      // Update state
      setWalletMode('social');
      setIsAuthenticated(true);
      setWalletAddress(address);
      setUserInfo({
        email: info.email,
        name: info.name,
        profileImage: info.profileImage,
        provider: info.typeOfLogin || 'unknown',
        verifierId: info.verifierId || '',
      });

      // Send user info to backend API to create/update user record
      await fetch('/api/users/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address, userInfo: info }),
      });
    } catch (error) {
      console.error('Social login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithWeb3 = async () => {
    try {
      setIsLoading(true);
      
      // Web3 wallet connection is handled by RainbowKit/wagmi
      // This function just updates our auth context
      const address = await getWalletAddress();
      
      if (!address) {
        throw new Error('No Web3 wallet connected');
      }

      setWalletMode('web3');
      setIsAuthenticated(true);
      setWalletAddress(address);
      setUserInfo(null); // Web3 wallets don't have user info
    } catch (error) {
      console.error('Web3 login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);

      if (walletMode === 'social') {
        const web3auth = getWeb3Auth();
        if (web3auth && web3auth.connected) {
          await web3auth.logout();
        }
        resetWeb3Auth();
        
        // Clear backend session (only for social login)
        await fetch('/api/auth/logout', { method: 'POST' });
      }
      // For Web3 mode, disconnection is handled by RainbowKit/wagmi (no backend session)

      // Clear state
      setIsAuthenticated(false);
      setWalletAddress(null);
      setUserInfo(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const switchWalletMode = (mode: WalletMode) => {
    setWalletMode(mode);
    setWalletModeState(mode);
    
    // Clear current authentication state when switching modes
    setIsAuthenticated(false);
    setWalletAddress(null);
    setUserInfo(null);
  };

  const value: AuthContextType = {
    isAuthenticated,
    walletMode,
    walletAddress,
    userInfo,
    isLoading,
    loginWithSocial,
    loginWithWeb3,
    logout,
    switchWalletMode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
