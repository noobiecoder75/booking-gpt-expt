'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Plus,
  LogOut,
  Sparkles,
  Menu,
  X,
  TrendingUp,
  Receipt,
  CreditCard,
  DollarSign,
  PieChart
} from 'lucide-react';
import { useState } from 'react';

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      // Use the server-side logout route for more reliable session cleanup
      const response = await fetch('/auth/logout', {
        method: 'POST',
        credentials: 'include' // Important for cookie handling
      });

      if (!response.ok) {
        throw new Error(`Logout failed: ${response.status}`);
      }

      // Server logout successful, redirect to login
      window.location.href = '/auth/login';
    } catch (error) {
      console.error('Logout error:', error);

      // Fallback to client-side logout
      try {
        await signOut();
      } catch (clientError) {
        console.error('Client-side logout also failed:', clientError);
      }

      // Force redirect regardless of errors
      window.location.href = '/auth/login';
    }
  };

  const navItems = [
    {
      href: '/dashboard/quotes',
      label: 'Dashboard',
      icon: LayoutDashboard,
      active: pathname === '/dashboard/quotes'
    },
    {
      href: '/dashboard/contacts',
      label: 'Contacts',
      icon: Users,
      active: pathname === '/dashboard/contacts'
    },
    {
      href: '/dashboard/timeline',
      label: 'Timeline',
      icon: Calendar,
      active: pathname === '/dashboard/timeline'
    },
    {
      href: '/dashboard/finances',
      label: 'Finances',
      icon: TrendingUp,
      active: pathname?.startsWith('/dashboard/finances')
    },
    {
      href: '/dashboard/invoices',
      label: 'Invoices',
      icon: Receipt,
      active: pathname?.startsWith('/dashboard/invoices')
    },
    {
      href: '/dashboard/commissions',
      label: 'Commissions',
      icon: DollarSign,
      active: pathname?.startsWith('/dashboard/commissions')
    },
    {
      href: '/dashboard/expenses',
      label: 'Expenses',
      icon: CreditCard,
      active: pathname?.startsWith('/dashboard/expenses')
    },
    {
      href: '/dashboard/quote-wizard',
      label: 'Create Quote',
      icon: Plus,
      active: pathname?.startsWith('/dashboard/quote-wizard'),
      highlight: true
    },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-clio-gray-900 border-b border-clio-gray-200 dark:border-clio-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard/quotes" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-clio-blue rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">TravelFlow</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                  ${item.active
                    ? 'bg-clio-gray-100 dark:bg-clio-gray-800 text-clio-gray-900 dark:text-clio-gray-100 font-bold'
                    : 'text-clio-gray-600 dark:text-clio-gray-400 hover:text-clio-gray-900 dark:hover:text-clio-gray-100 hover:bg-clio-gray-50 dark:hover:bg-clio-gray-800'
                  }
                  ${item.highlight && !item.active
                    ? 'text-clio-blue hover:text-clio-blue-hover hover:bg-clio-blue/10'
                    : ''
                  }
                `}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-sm text-clio-gray-600 dark:text-clio-gray-400">
              {user?.email || profile?.email}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-clio-gray-600 dark:text-clio-gray-400 hover:text-clio-gray-900 dark:hover:text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-clio-gray-100 dark:hover:bg-clio-gray-800 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-clio-gray-600 dark:text-clio-gray-400" />
            ) : (
              <Menu className="w-5 h-5 text-clio-gray-600 dark:text-clio-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-clio-gray-900 border-t border-clio-gray-200 dark:border-clio-gray-800">
          <div className="container mx-auto px-4 py-4">
            <div className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${item.active
                      ? 'bg-clio-gray-100 dark:bg-clio-gray-800 text-clio-gray-900 dark:text-clio-gray-100 font-bold'
                      : 'text-clio-gray-600 dark:text-clio-gray-400 hover:text-clio-gray-900 dark:hover:text-clio-gray-100 hover:bg-clio-gray-50 dark:hover:bg-clio-gray-800'
                    }
                    ${item.highlight && !item.active
                      ? 'text-clio-blue hover:text-clio-blue-hover hover:bg-clio-blue/10'
                      : ''
                    }
                  `}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              ))}

              <div className="border-t border-clio-gray-200 dark:border-clio-gray-800 pt-4 mt-4">
                <div className="text-sm text-clio-gray-600 dark:text-clio-gray-400 px-4 mb-3 font-medium">
                  {user?.email || profile?.email}
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 text-clio-gray-600 dark:text-clio-gray-400 hover:text-clio-gray-900 dark:hover:text-white hover:bg-clio-gray-50 dark:hover:bg-clio-gray-800 rounded-lg w-full transition-colors font-medium"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}