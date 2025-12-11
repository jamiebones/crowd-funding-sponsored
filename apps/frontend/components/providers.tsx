'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { ApolloProvider } from '@apollo/client/react';
import { Toaster } from 'sonner';

import { config } from '@/lib/wagmi';
import { apolloClient } from '@/lib/apollo';
import { ReactNode, useState } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { SkipToContent } from './SkipToContent';
import { AuthProvider } from '@/context/authContext';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <>
      <SkipToContent />
      <ErrorBoundary>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider
              theme={darkTheme({
                accentColor: '#3b82f6',
                accentColorForeground: 'white',
                borderRadius: 'medium',
              })}
            >
              <ApolloProvider client={apolloClient}>
                <AuthProvider>
                  <main id="main-content">
                    {children}
                  </main>
                  <Toaster position="top-right" richColors />
                </AuthProvider>
              </ApolloProvider>
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </ErrorBoundary>
    </>
  );
}
