'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/AuthProvider';
import { useSidebarStore } from '@/store/sidebar-store';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Plus,
  LogOut,
  Sparkles,
  Menu,
  X,
  TrendingUp,
  Receipt,
  CreditCard,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Settings,
  ClipboardList,
  Upload,
  CalendarCheck
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const { collapsed, mobileMenuOpen, toggleCollapsed, setMobileMenuOpen } = useSidebarStore();
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(['finances']));
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Component lifecycle logging
  useEffect(() => {
    console.log('[Sidebar] Component mounted');
    return () => {
      console.log('[Sidebar] Component unmounted');
    };
  }, []);

  // Auth data logging
  useEffect(() => {
    console.log('[Sidebar] Auth data:', {
      hasUser: !!user,
      userEmail: user?.email,
      hasProfile: !!profile,
      profileEmail: profile?.email
    });
  }, [user, profile]);

  // Pathname logging
  useEffect(() => {
    console.log('[Sidebar] Pathname changed:', pathname);
  }, [pathname]);

  // State changes logging
  useEffect(() => {
    console.log('[Sidebar] State:', {
      collapsed,
      mobileMenuOpen,
      expandedMenus: Array.from(expandedMenus)
    });
  }, [collapsed, mobileMenuOpen, expandedMenus]);

  const handleLogout = async () => {
    if (isLoggingOut) {
      console.log('[Sidebar] Logout already in progress, ignoring duplicate click');
      return;
    }

    console.log('[Sidebar] Logout initiated');
    setIsLoggingOut(true);

    try {
      // Use the server-side logout route for more reliable session cleanup
      console.log('[Sidebar] Calling server logout route');
      const response = await fetch('/auth/logout', {
        method: 'POST',
        credentials: 'include' // Important for cookie handling
      });

      if (!response.ok) {
        throw new Error(`Logout failed: ${response.status}`);
      }

      console.log('[Sidebar] Server logout successful, redirecting...');
      // The logout route handles the redirect, but we'll ensure it happens
      window.location.href = '/auth/login';
    } catch (error) {
      console.error('[Sidebar] Logout error:', error);
      console.log('[Sidebar] Attempting client-side logout as fallback');

      // Fallback to client-side logout
      try {
        await signOut();
      } catch (clientError) {
        console.error('[Sidebar] Client-side logout also failed:', clientError);
      }

      // Force redirect regardless of errors
      console.log('[Sidebar] Force redirecting to /auth/login');
      window.location.href = '/auth/login';
    }
  };

  const toggleMenu = (menuKey: string) => {
    console.log('[Sidebar] Toggling menu:', menuKey);
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(menuKey)) {
      newExpanded.delete(menuKey);
      console.log('[Sidebar] Menu collapsed:', menuKey);
    } else {
      newExpanded.add(menuKey);
      console.log('[Sidebar] Menu expanded:', menuKey);
    }
    setExpandedMenus(newExpanded);
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
      href: '/dashboard/bookings',
      label: 'Bookings',
      icon: CalendarCheck,
      active: pathname?.startsWith('/dashboard/bookings')
    },
    {
      href: '/dashboard/finances',
      label: 'Finances',
      icon: TrendingUp,
      active: pathname?.startsWith('/dashboard/finances')
    },
    {
      href: '/dashboard/tasks',
      label: 'Tasks',
      icon: ClipboardList,
      active: pathname?.startsWith('/dashboard/tasks')
    },
    {
      href: '/admin/rates',
      label: 'Rate Upload',
      icon: Upload,
      active: pathname?.startsWith('/admin/rates')
    },
    {
      href: '/admin/settings',
      label: 'Settings',
      icon: Settings,
      active: pathname?.startsWith('/admin/settings')
    },
  ];

  // Log navigation items with active states
  useEffect(() => {
    console.log('[Sidebar] Navigation items:', navItems.map(item => ({
      label: item.label,
      href: item.href,
      active: item.active
    })));
  }, [pathname]);

  const createQuoteItem = {
    href: '/dashboard/quote-wizard',
    label: 'Create Quote',
    icon: Plus,
    active: pathname?.startsWith('/dashboard/quote-wizard'),
    highlight: true
  };

  // Log create quote item
  useEffect(() => {
    console.log('[Sidebar] Create Quote item:', {
      label: createQuoteItem.label,
      href: createQuoteItem.href,
      active: createQuoteItem.active
    });
  }, [pathname]);

  // Log when component renders
  console.log('[Sidebar] Rendering - pathname:', pathname, 'collapsed:', collapsed, 'mobileMenuOpen:', mobileMenuOpen);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-clio-gray-900 shadow-sm border border-clio-gray-200 dark:border-clio-gray-800"
        onClick={() => {
          console.log('[Sidebar] Mobile menu toggled to:', !mobileMenuOpen);
          setMobileMenuOpen(!mobileMenuOpen);
        }}
      >
        {mobileMenuOpen ? (
          <X className="w-5 h-5 text-clio-gray-600 dark:text-clio-gray-400" />
        ) : (
          <Menu className="w-5 h-5 text-clio-gray-600 dark:text-clio-gray-400" />
        )}
      </button>

      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col fixed left-0 top-0 h-full bg-white dark:bg-clio-gray-900 border-r border-clio-gray-200 dark:border-clio-gray-800 z-40 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
        {/* Header */}
        <div className="p-4 border-b border-clio-gray-100 dark:border-clio-gray-800">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <Link href="/dashboard/quotes" className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-clio-blue rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-lg font-bold text-clio-gray-900 dark:text-clio-gray-100">TravelFlow</span>
                </div>
              </Link>
            )}
            {collapsed && (
              <Link href="/dashboard/quotes" className="flex justify-center">
                <div className="w-8 h-8 bg-clio-blue rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
              </Link>
            )}
            <button
              onClick={() => {
                console.log('[Sidebar] Collapse toggled to:', !collapsed);
                toggleCollapsed();
              }}
              className="p-1.5 rounded-lg hover:bg-clio-gray-100 dark:hover:bg-clio-gray-800 transition-colors"
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4 text-clio-gray-600 dark:text-clio-gray-400" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-clio-gray-600 dark:text-clio-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {/* Create Quote Button */}
          <Link
            href={createQuoteItem.href}
            className={`
              flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 font-bold
              ${createQuoteItem.active
                ? 'bg-clio-gray-100 text-clio-blue shadow-sm'
                : 'bg-clio-blue text-white hover:bg-clio-blue-hover shadow-sm'
              }
              ${collapsed ? 'justify-center' : ''}
            `}
          >
            <createQuoteItem.icon className={collapsed ? "w-8 h-8" : "w-5 h-5"} />
            {!collapsed && <span>{createQuoteItem.label}</span>}
          </Link>

          <div className="h-4"></div>

          {/* Regular Navigation Items */}
          {navItems.map((item) => {
            // @ts-ignore - Handle nested menu items
            if (item.children) {
              const isExpanded = expandedMenus.has(item.key || '');
              const hasActiveChild = item.children.some((child: any) => child.active);

              return (
                <div key={item.key}>
                  {/* Parent Menu Item */}
                  <button
                    onClick={() => !collapsed && toggleMenu(item.key || '')}
                    className={`
                      w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
                      ${item.active
                        ? 'bg-clio-gray-100 dark:bg-clio-gray-800 text-clio-gray-900 dark:text-clio-gray-100 font-bold shadow-sm'
                        : 'text-clio-gray-600 dark:text-clio-gray-400 hover:text-clio-gray-900 dark:hover:text-clio-gray-100 hover:bg-clio-gray-50 dark:hover:bg-clio-gray-800'
                      }
                      ${collapsed ? 'justify-center' : 'justify-between'}
                    `}
                    title={collapsed ? item.label : undefined}
                  >
                    <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
                      <item.icon className={collapsed ? "w-8 h-8" : "w-5 h-5"} />
                      {!collapsed && <span>{item.label}</span>}
                    </div>
                    {!collapsed && (
                      isExpanded ?
                        <ChevronUp className="w-4 h-4" /> :
                        <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {/* Child Menu Items */}
                  {!collapsed && isExpanded && (
                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-clio-gray-200 dark:border-clio-gray-800 pl-2">
                      {item.children.map((child: any) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`
                            flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm
                            ${child.active
                              ? 'bg-clio-gray-100 dark:bg-clio-gray-800 text-clio-gray-900 dark:text-clio-gray-100 font-bold'
                              : 'text-clio-gray-600 dark:text-clio-gray-400 hover:text-clio-gray-900 dark:hover:text-clio-gray-100 hover:bg-clio-gray-50 dark:hover:bg-clio-gray-800'
                            }
                          `}
                        >
                          <child.icon className="w-4 h-4" />
                          <span>{child.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            // Regular menu item (no children)
            return (
            <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
                  ${item.active
                    ? 'bg-clio-gray-100 dark:bg-clio-gray-800 text-clio-gray-900 dark:text-clio-gray-100 font-bold shadow-sm'
                    : 'text-clio-gray-600 dark:text-clio-gray-400 hover:text-clio-gray-900 dark:hover:text-clio-gray-100 hover:bg-clio-gray-50 dark:hover:bg-clio-gray-800'
                  }
                  ${collapsed ? 'justify-center' : ''}
                `}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className={collapsed ? "w-8 h-8" : "w-5 h-5"} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-clio-gray-200 dark:border-clio-gray-800 space-y-2">
          {!collapsed && (
            <div className="text-sm text-clio-gray-600 dark:text-clio-gray-400 mb-3 px-3">
              {user?.email || profile?.email}
            </div>
          )}
          {!collapsed && <ThemeToggle />}
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "sm"}
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`text-clio-gray-600 dark:text-clio-gray-400 hover:text-clio-gray-900 dark:hover:text-clio-gray-100 w-full ${collapsed ? 'justify-center' : 'justify-start'}`}
            title={collapsed ? 'Sign Out' : undefined}
          >
            <LogOut className={collapsed ? "w-6 h-6" : "w-4 h-4"} />
            {!collapsed && <span className="ml-2">{isLoggingOut ? 'Signing Out...' : 'Sign Out'}</span>}
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white dark:bg-clio-gray-900 border-r border-clio-gray-200 dark:border-clio-gray-800">
            {/* Header */}
            <div className="p-4 border-b border-clio-gray-100 dark:border-clio-gray-800">
              <Link href="/dashboard/quotes" className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-clio-blue rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-lg font-bold text-clio-gray-900 dark:text-clio-gray-100">TravelFlow</span>
                </div>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
              {/* Create Quote Button */}
              <Link
                href={createQuoteItem.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-2 py-3 rounded-xl transition-all duration-200 font-bold
                  ${createQuoteItem.active
                    ? 'bg-clio-gray-100 text-clio-blue shadow-sm'
                    : 'bg-clio-blue text-white hover:bg-clio-blue-hover shadow-sm'
                  }
                `}
              >
                <createQuoteItem.icon className="w-5 h-5" />
                <span>{createQuoteItem.label}</span>
              </Link>

              <div className="h-4"></div>

              {/* Regular Navigation Items */}
              {navItems.map((item) => {
                // @ts-ignore - Handle nested menu items
                if (item.children) {
                  const isExpanded = expandedMenus.has(item.key || '');

                  return (
                    <div key={item.key}>
                      {/* Parent Menu Item */}
                      <button
                        onClick={() => toggleMenu(item.key || '')}
                        className={`
                          w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 justify-between
                          ${item.active
                            ? 'bg-clio-gray-100 dark:bg-clio-gray-800 text-clio-gray-900 dark:text-clio-gray-100 font-bold shadow-sm'
                            : 'text-clio-gray-600 dark:text-clio-gray-400 hover:text-clio-gray-900 dark:hover:text-clio-gray-100 hover:bg-clio-gray-50 dark:hover:bg-clio-gray-800'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="w-5 h-5" />
                          <span>{item.label}</span>
                        </div>
                        {isExpanded ?
                          <ChevronUp className="w-4 h-4" /> :
                          <ChevronDown className="w-4 h-4" />
                        }
                      </button>

                      {/* Child Menu Items */}
                      {isExpanded && (
                        <div className="ml-4 mt-1 space-y-1 border-l-2 border-clio-gray-200 dark:border-clio-gray-800 pl-2">
                          {item.children.map((child: any) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className={`
                                flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm
                                ${child.active
                                  ? 'bg-clio-gray-100 dark:bg-clio-gray-800 text-clio-gray-900 dark:text-clio-gray-100 font-bold'
                                  : 'text-clio-gray-600 dark:text-clio-gray-400 hover:text-clio-gray-900 dark:hover:text-clio-gray-100 hover:bg-clio-gray-50 dark:hover:bg-clio-gray-800'
                                }
                              `}
                            >
                              <child.icon className="w-4 h-4" />
                              <span>{child.label}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                // Regular menu item (no children)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
                      ${item.active
                        ? 'bg-clio-gray-100 dark:bg-clio-gray-800 text-clio-gray-900 dark:text-clio-gray-100 font-bold shadow-sm'
                        : 'text-clio-gray-600 dark:text-clio-gray-400 hover:text-clio-gray-900 dark:hover:text-clio-gray-100 hover:bg-clio-gray-50 dark:hover:bg-clio-gray-800'
                      }
                    `}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User Section */}
            <div className="p-4 border-t border-clio-gray-200 dark:border-clio-gray-800 space-y-2">
              <div className="text-sm text-clio-gray-600 dark:text-clio-gray-400 mb-3 px-3">
                {user?.email || profile?.email}
              </div>
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-clio-gray-600 dark:text-clio-gray-400 hover:text-clio-gray-900 dark:hover:text-white w-full justify-start"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
              </Button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}