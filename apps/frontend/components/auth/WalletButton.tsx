'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAuth } from '@/context/authContext';
import { LogOut } from 'lucide-react';

interface WalletButtonProps {
  showBalance?: boolean;
  chainStatus?: 'full' | 'icon' | 'none';
}

export const WalletButton: React.FC<WalletButtonProps> = ({ 
  showBalance = true,
  chainStatus = 'icon' 
}) => {
  const { walletMode, walletAddress, logout, isAuthenticated } = useAuth();

  // For Web3 wallets, use RainbowKit's native ConnectButton
  if (walletMode === 'web3') {
    return (
      <ConnectButton 
        showBalance={{
          smallScreen: false,
          largeScreen: showBalance,
        }}
        chainStatus={chainStatus}
        accountStatus={{
          smallScreen: 'avatar',
          largeScreen: 'full',
        }}
      />
    );
  }

  // For social login, clone RainbowKit's styling using ConnectButton.Custom
  if (walletMode === 'social' && isAuthenticated && walletAddress) {
    return (
      <ConnectButton.Custom>
        {({ account, chain, mounted }) => {
          return (
            <div
              style={{
                display: 'flex',
                gap: 12,
                ...(mounted ? {} : {
                  opacity: 0,
                  pointerEvents: 'none',
                  userSelect: 'none',
                }),
              }}
            >
              {/* Chain indicator (optional, using BSC by default) */}
              {chainStatus !== 'none' && (
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.06)',
                    borderRadius: 12,
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                  className="dark:bg-white/10"
                >
                  <div style={{ width: 20, height: 20 }}>
                    {/* BSC Logo */}
                    <img 
                      src="https://cryptologos.cc/logos/bnb-bnb-logo.png" 
                      alt="BSC"
                      style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                    />
                  </div>
                  {chainStatus === 'full' && <span>BSC</span>}
                </div>
              )}

              {/* Account button */}
              <button
                onClick={logout}
                style={{
                  background: 'rgba(0, 0, 0, 0.06)',
                  borderRadius: 12,
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                  border: 'none',
                }}
                className="dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
                type="button"
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, 
                      hsl(${parseInt(walletAddress.slice(2, 10), 16) % 360}, 70%, 60%), 
                      hsl(${parseInt(walletAddress.slice(10, 18), 16) % 360}, 70%, 40%)
                    )`,
                  }}
                />
                
                {/* Address */}
                <span>
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </span>

                {/* Logout icon */}
                <LogOut className="w-4 h-4 opacity-60" />
              </button>
            </div>
          );
        }}
      </ConnectButton.Custom>
    );
  }

  // Fallback: Show connect button
  return <ConnectButton />;
};
