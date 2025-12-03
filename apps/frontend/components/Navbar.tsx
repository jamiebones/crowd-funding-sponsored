'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, Rocket, LayoutGrid, TrendingUp, User, Shield, BarChart3 } from 'lucide-react';
import { useAccount } from 'wagmi';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { address } = useAccount();

  const navigation = [
    { name: 'Explore', href: '/projects', icon: LayoutGrid },
    { name: 'Create', href: '/new-project', icon: Rocket },
    { name: 'Dashboard', href: '/dashboard', icon: TrendingUp, requiresAuth: true },
  ];

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/');

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <span className="hidden sm:inline">CrowdFund</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navigation.map((item) => {
              // Hide auth-required items if not connected
              if (item.requiresAuth && !address) return null;
              
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
                    ${isActive(item.href)
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Right Side - Connect Button & User Menu */}
          <div className="flex items-center gap-3">
            {/* User Profile Link (when connected) */}
            {address && (
              <Link
                href={`/user/${address}`}
                className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="My Profile"
              >
                <User className="w-4 h-4" />
              </Link>
            )}

            {/* Admin Link (only for factory owner - you can add check later) */}
            {address && (
              <Link
                href="/admin"
                className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Admin Dashboard"
              >
                <Shield className="w-4 h-4" />
              </Link>
            )}

            {/* Connect Button */}
            <div className="hidden md:block">
              <ConnectButton 
                showBalance={{
                  smallScreen: false,
                  largeScreen: true,
                }}
                chainStatus="icon"
              />
            </div>

            {/* Stats Link */}
            <Link
              href="/stats"
              className={`
                hidden md:flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors
                ${isActive('/stats')
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }
              `}
              title="Platform Statistics"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden lg:inline">Stats</span>
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex flex-col gap-2">
              {navigation.map((item) => {
                // Hide auth-required items if not connected
                if (item.requiresAuth && !address) return null;
                
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors
                      ${isActive(item.href)
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}

              {address && (
                <>
                  <Link
                    href={`/user/${address}`}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <User className="w-5 h-5" />
                    My Profile
                  </Link>
                  <Link
                    href="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Shield className="w-5 h-5" />
                    Admin
                  </Link>
                </>
              )}

              <div className="pt-3 border-t border-gray-200 dark:border-gray-800 mt-2">
                <ConnectButton 
                  showBalance={{
                    smallScreen: true,
                    largeScreen: true,
                  }}
                  chainStatus="full"
                />
              </div>

              <Link
                href="/stats"
                onClick={() => setIsMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors
                  ${isActive('/stats')
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
              >
                <BarChart3 className="w-5 h-5" />
                Stats
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
