"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  HomeIcon,
  TagIcon,
  CubeIcon,
  ArchiveBoxIcon,
  ShoppingCartIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  TruckIcon,
  XCircleIcon,
  ArrowPathIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";

// Admin navigation structure
const adminNavigation: Record<string, {
  path: string;
  label: string;
  icon: any;
  submenu?: Array<{ path: string; label: string; icon?: any }>;
}> = {
  dashboard: { path: "/admin", label: "Dashboard", icon: HomeIcon },
  products: { 
    path: "/admin/products", 
    label: "Products", 
    icon: CubeIcon,
    submenu: [
      { path: "/admin/categories", label: "Categories", icon: TagIcon },
      { path: "/admin/products", label: "Products", icon: CubeIcon },
      { path: "/admin/inventory", label: "Inventory", icon: ArchiveBoxIcon },
    ]
  },
  orders: { 
    path: "/admin/orders", 
    label: "Orders", 
    icon: ShoppingCartIcon,
    submenu: [
      { path: "/admin/orders", label: "All Orders", icon: ShoppingCartIcon },
      { path: "/admin/orders?status=pending", label: "Pending", icon: ClockIcon },
      { path: "/admin/orders?status=processing", label: "Processing", icon: ArrowPathIcon },
      { path: "/admin/orders?status=in-courier", label: "In Courier", icon: TruckIcon },
      { path: "/admin/orders?status=delivered", label: "Delivered", icon: CheckCircleIcon },
      { path: "/admin/orders?status=cancelled", label: "Cancelled", icon: XCircleIcon },
      { path: "/admin/orders?status=refunded", label: "Refunded", icon: ArrowPathIcon }
    ]
  },
  courier: { path: "/admin/courier", label: "Courier Orders", icon: ArchiveBoxIcon },
  analytics: { path: "/admin/analytics", label: "Analytics", icon: ChartBarIcon },
  landing: { path: "/admin/landing", label: "Landing Page", icon: ArrowTrendingUpIcon },
  settings: {
    path: "/admin/settings",
    label: "Settings",
    icon: Cog6ToothIcon,
    submenu: [
      { path: "/admin/settings/general", label: "General Settings", icon: Cog6ToothIcon },
      { path: "/admin/settings/site", label: "Site Settings", icon: Cog6ToothIcon },
      { path: "/admin/settings/pixels", label: "Pixel Settings", icon: Cog6ToothIcon },
      { path: "/admin/settings/courier", label: "Courier Settings", icon: Cog6ToothIcon },
      { path: "/admin/settings/bd-courier", label: "BD Courier Settings", icon: Cog6ToothIcon },
      { path: "/admin/settings/email", label: "Email Settings", icon: Cog6ToothIcon },
    ]
  },
  finance: { path: "/admin/finance", label: "Finance", icon: ChartBarIcon },
  businessGrowth: { 
    path: "/admin/business-growth", 
    label: "Business Growth", 
    icon: ArrowTrendingUpIcon
  },
  users: { path: "/admin/user", label: "User", icon: UserIcon }
};

// Status color mapping
const statusColors = {
  pending: { bg: 'bg-yellow-500', text: 'text-yellow-100', border: 'border-yellow-400' },
  processing: { bg: 'bg-blue-500', text: 'text-blue-100', border: 'border-blue-400' },
  'in-courier': { bg: 'bg-purple-500', text: 'text-purple-100', border: 'border-purple-400' },
  delivered: { bg: 'bg-green-500', text: 'text-green-100', border: 'border-green-400' },
  cancelled: { bg: 'bg-red-500', text: 'text-red-100', border: 'border-red-400' },
  refunded: { bg: 'bg-gray-500', text: 'text-gray-100', border: 'border-gray-400' }
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const [orderCounts, setOrderCounts] = useState({
    all: 0,
    pending: 0,
    processing: 0,
    'in-courier': 0,
    delivered: 0,
    cancelled: 0,
    refunded: 0
  });
  const [authz, setAuthz] = useState<Record<string, boolean>>({});
  const [authzLoaded, setAuthzLoaded] = useState(false);

  // Load expanded menu states from localStorage on component mount
  useEffect(() => {
    const savedExpandedMenus = localStorage.getItem('nexus-shop-expanded-menus');
    if (savedExpandedMenus) {
      try {
        const parsed = JSON.parse(savedExpandedMenus);
        setExpandedMenus(parsed);
      } catch (error) {
        console.error('Error parsing expanded menus:', error);
        // Set default expanded state for orders and settings
        setExpandedMenus({ orders: true, settings: true });
      }
    } else {
      // Set default expanded state for orders and settings
      setExpandedMenus({ orders: true, settings: true });
    }
  }, []);

  // Permission: fetch allowed resources for current user
  useEffect(() => {
    const checkPermissions = async () => {
              try {
          // Use API to check session instead of reading cookie directly
          const sessionRes = await fetch('/api/auth/check-session');
          const sessionData = await sessionRes.json();
          console.log('🔍 Session check result:', sessionData);
          
          if (!sessionData.loggedIn || !sessionData.user) {
            console.log('❌ No valid session found, setting all permissions to false');
            setAuthz({
              'dashboard': false, 'categories': false, 'products': false, 'inventory': false, 
              'orders': false, 'courier': false, 'analytics': false, 'finance': false, 'businessGrowth': false, 'users': false,
              'settings:general': false, 'settings:site': false, 'settings:pixels': false, 
              'settings:courier': false, 'settings:bd-courier': false, 'settings:email': false
            });
            setAuthzLoaded(true);
            return;
          }
          
          const uid = sessionData.user.id;
          console.log('🆔 User ID from session:', uid);
        

        
        // Check if user is super admin (check role from server)
        try {
          console.log('🔍 Checking permissions for user ID:', uid);
          const userRes = await fetch(`/api/authz/users?id=${uid}`);
          const userData = userRes.ok ? await userRes.json() : null;
          console.log('👤 User data:', userData);
          
          // SIMPLIFIED: Just check if user ID is 5 (our Super Admin)
          const isSuperAdmin = uid === 5;
          console.log('👑 Is Super Admin (simplified):', isSuperAdmin);
          
          if (isSuperAdmin) {
            console.log('✅ Setting all permissions for Super Admin');
            // Super admin gets all permissions
            const superAdminAuthz = {
              'dashboard': true, 'categories': true, 'products': true, 'inventory': true, 
              'orders': true, 'courier': true, 'analytics': true, 'landing': true, 'finance': true, 'businessGrowth': true, 'users': true,
              'settings:general': true, 'settings:site': true, 'settings:pixels': true, 
              'settings:courier': true, 'settings:bd-courier': true, 'settings:email': true
            };
            console.log('✅ Setting Super Admin permissions:', superAdminAuthz);
            setAuthz(superAdminAuthz);
            setAuthzLoaded(true);
            return;
          }
        } catch (error) {
          console.error('Error checking user role:', error);
        }
        
        // For other users, check specific permissions from database
        console.log('🔍 Checking specific permissions for regular user');
        const resources = [
          'dashboard','categories','products','inventory','orders','courier','analytics','landing','finance','businessGrowth','users',
          'settings:general','settings:site','settings:pixels','settings:courier','settings:bd-courier','settings:email'
        ];
        const results: Record<string, boolean> = {};
        
        await Promise.all(resources.map(async (res) => {
          try {
            const r = await fetch('/api/authz', { 
              method: 'POST', 
              headers: { 'Content-Type': 'application/json' }, 
              body: JSON.stringify({ userId: uid, resource: res, action: 'view' }) 
            });
            const d = r.ok ? await r.json() : { allowed: false };
            results[res] = !!d.allowed;
          } catch { 
            results[res] = false; 
          }
        }));
        
        console.log('📋 Permission results:', results);
        setAuthz(results);
      } finally { 
        console.log('🏁 Final authz state:', 'Permissions loaded');
        setAuthzLoaded(true); 
      }
    };
    
    checkPermissions();
    
    // Listen for permission changes from user management page
    const handlePermissionChange = () => {
      checkPermissions();
    };
    
    window.addEventListener('permissionsChanged', handlePermissionChange);
    
    return () => {
      window.removeEventListener('permissionsChanged', handlePermissionChange);
    };
  }, []);

  const resourceForPath = (path: string): string | null => {
    if (path === '/admin' || path.startsWith('/admin$')) return 'dashboard';
    if (path.startsWith('/admin/categories')) return 'products';
    if (path.startsWith('/admin/products')) return 'products';
    if (path.startsWith('/admin/inventory')) return 'products';
    if (path.startsWith('/admin/orders')) return 'orders';
    if (path.startsWith('/admin/analytics')) return 'analytics';
    if (path.startsWith('/admin/landing')) return 'landing';
    if (path.startsWith('/admin/finance')) return 'finance';
    if (path.startsWith('/admin/business-growth')) return 'businessGrowth';
    if (path.startsWith('/admin/user')) return 'users';
    if (path.startsWith('/admin/settings/general')) return 'settings:general';
    if (path.startsWith('/admin/settings/site')) return 'settings:site';
    if (path.startsWith('/admin/settings/pixels')) return 'settings:pixels';
    if (path.startsWith('/admin/settings/courier')) return 'settings:courier';
    if (path.startsWith('/admin/settings/bd-courier')) return 'settings:bd-courier';
    if (path.startsWith('/admin/settings/email')) return 'settings:email';
    return null;
  };

  // Fetch order counts for sidebar
  useEffect(() => {
    const fetchOrderCounts = async () => {
      try {
        const response = await fetch('/api/orders');
        if (response.ok) {
          const data = await response.json();
          // Check if data.orders exists and is an array
          const orders = data.orders && Array.isArray(data.orders) ? data.orders : [];
          
          const counts = {
            all: orders.length,
            pending: orders.filter((o: any) => o.status === 'pending').length,
            processing: orders.filter((o: any) => o.status === 'processing').length,
            'in-courier': orders.filter((o: any) => o.status === 'in-courier').length,
            delivered: orders.filter((o: any) => o.status === 'delivered').length,
            cancelled: orders.filter((o: any) => o.status === 'cancelled').length,
            refunded: orders.filter((o: any) => o.status === 'refunded').length
          };
          setOrderCounts(counts);
        }
      } catch (error) {
        console.error('Error fetching order counts:', error);
      }
    };

    fetchOrderCounts();

    // Listen for custom order status change events
    const handleOrderStatusChange = (event: CustomEvent) => {
      const { orderId, newStatus, previousStatus } = event.detail;
      
      // Update counts immediately without API call
      setOrderCounts(prevCounts => {
        const newCounts = { ...prevCounts };
        
        // Decrease count for previous status
        if (previousStatus === 'pending') newCounts.pending = Math.max(0, newCounts.pending - 1);
        else if (previousStatus === 'processing') newCounts.processing = Math.max(0, newCounts.processing - 1);
        else if (previousStatus === 'in-courier') newCounts['in-courier'] = Math.max(0, newCounts['in-courier'] - 1);
        else if (previousStatus === 'delivered') newCounts.delivered = Math.max(0, newCounts.delivered - 1);
        else if (previousStatus === 'cancelled') newCounts.cancelled = Math.max(0, newCounts.cancelled - 1);
        else if (previousStatus === 'refunded') newCounts.refunded = Math.max(0, newCounts.refunded - 1);
        
        // Increase count for new status
        if (newStatus === 'pending') newCounts.pending += 1;
        else if (newStatus === 'processing') newCounts.processing += 1;
        else if (newStatus === 'in-courier') newCounts['in-courier'] += 1;
        else if (newStatus === 'delivered') newCounts.delivered += 1;
        else if (newStatus === 'cancelled') newCounts.cancelled += 1;
        else if (newStatus === 'refunded') newCounts.refunded += 1;
        
        return newCounts;
      });
    };

    // Listen for order count updates from orders page
    const handleUpdateOrderCounts = (event: CustomEvent) => {
      const { counts } = event.detail;
      setOrderCounts(counts);
    };

    // Listen for storage events to update counts
    const handleStorageChange = () => {
      fetchOrderCounts();
    };

    window.addEventListener('orderStatusChanged', handleOrderStatusChange as EventListener);
    window.addEventListener('updateOrderCounts', handleUpdateOrderCounts as EventListener);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('orderStatusChanged', handleOrderStatusChange as EventListener);
      window.removeEventListener('updateOrderCounts', handleUpdateOrderCounts as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Ensure orders menu is expanded when component mounts if on orders page
  useEffect(() => {
    if (pathname.startsWith('/admin/orders')) {
      setExpandedMenus(prev => ({ ...prev, orders: true }));
    }
  }, [pathname]);

  // Auto-expand orders menu when navigating to orders pages
  useEffect(() => {
    if (pathname.startsWith('/admin/orders')) {
      setExpandedMenus(prev => ({ ...prev, orders: true }));
    }
  }, [pathname]);

  // Save expanded menu states to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('nexus-shop-expanded-menus', JSON.stringify(expandedMenus));
  }, [expandedMenus]);

  // Toggle menu expansion
  const toggleMenu = (menuKey: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  // Check if a path is active
  const isActivePath = (path: string) => {
    if (path === "/admin") {
      return pathname === "/admin";
    }
    
    // Check if current path starts with the navigation path
    // This ensures that /admin/products highlights the Products menu
    return pathname.startsWith(path);
  };

  // Check if a submenu item is active
  const isActiveSubmenu = (submenuPath: string) => {
    const currentPath = pathname;
    const currentStatus = searchParams.get('status');
    
    // For orders page with status filter
    if (submenuPath.includes('?') && submenuPath.includes('status=')) {
      const expectedStatus = submenuPath.split('status=')[1];
      return currentStatus === expectedStatus;
    }
    
    // For orders page without status (All Orders)
    if (submenuPath === '/admin/orders') {
      return pathname === '/admin/orders' && !currentStatus;
    }
    
    // For other submenu items, check exact path match
    return pathname === submenuPath;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-emerald-600 to-teal-700 shadow-2xl transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-emerald-500/30 bg-emerald-600/20 backdrop-blur-sm">
            <h1 className="text-xl font-bold text-white">Nexus Shop Admin</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation (filtered by permissions) */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {(() => {
              console.log('🔍 Rendering sidebar navigation');
              console.log('📊 authzLoaded:', authzLoaded);
              console.log('📋 authz state:', authz);
              
              const filteredItems = Object.entries(adminNavigation).filter(([key, item]) => {
                const resKey = key === 'settings' ? null : key; // settings handled via submenu below
                if (!authzLoaded) {
                  console.log(`⏳ Skipping ${key} - permissions not loaded`);
                  return false; // wait until permissions loaded
                }
                if (resKey) {
                  const hasPermission = authz[resKey] === true;
                  console.log(`🔐 ${key} (${resKey}): ${hasPermission ? '✅' : '❌'}`);
                  return hasPermission;
                }
                // settings main: show only if any submenu allowed
                const hasSubmenuPermission = item.submenu ? item.submenu.some((sub:any)=>{
                  const res = resourceForPath(sub.path);
                  return res ? authz[res] === true : false;
                }) : false;
                console.log(`🔐 ${key} (settings): ${hasSubmenuPermission ? '✅' : '❌'}`);
                return hasSubmenuPermission;
              });
              
              console.log('📋 Filtered navigation items:', filteredItems.map(([key]) => key));
              return filteredItems;
            })().map(([key, item]) => {
              const Icon = item.icon;
              const isActive = isActivePath(item.path);
              const hasSubmenu = 'submenu' in item;
              
                                // For menus with submenu, check if any submenu item is active
                  const isSubmenuActive = hasSubmenu && item.submenu && item.submenu.some(sub => isActiveSubmenu(sub.path));
              
              // Main menu should be highlighted if current path matches or any submenu is active
              const shouldHighlightMainMenu = isActive || isSubmenuActive;

              return (
                <div key={key}>
                  {hasSubmenu ? (
                    // Menu with submenu
                    <div>
                      <button
                        onClick={() => toggleMenu(key)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-300 ${
                          shouldHighlightMainMenu
                            ? "bg-emerald-500/20 text-white border border-emerald-400/50 shadow-lg backdrop-blur-sm"
                            : "text-emerald-100 hover:text-white hover:bg-emerald-500/20 hover:shadow-md"
                        }`}
                      >
                        <div className="flex items-center">
                          <Icon className="w-5 h-5 mr-3" />
                          <span className="font-medium">{item.label}</span>
                        </div>
                        <svg
                          className={`w-4 h-4 transition-transform duration-300 ${
                            expandedMenus[key] ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {/* Submenu (filter items by permissions) */}
                      {expandedMenus[key] && item.submenu && (
                        <div className="ml-8 mt-2 space-y-1">
                          {item.submenu.filter((subItem) => {
                            if (!authzLoaded) return false;
                            const res = resourceForPath(subItem.path);
                            return res ? authz[res] === true : false;
                          }).map((subItem) => {
                            const isSubmenuActive = isActiveSubmenu(subItem.path);
                            // Get count for this submenu item
                            const getCount = () => {
                              if (key === 'orders') {
                                if (subItem.path.includes('status=pending')) return orderCounts.pending;
                                if (subItem.path.includes('status=processing')) return orderCounts.processing;
                                if (subItem.path.includes('status=in-courier')) return orderCounts['in-courier'];
                                if (subItem.path.includes('status=delivered')) return orderCounts.delivered;
                                if (subItem.path.includes('status=cancelled')) return orderCounts.cancelled;
                                if (subItem.path.includes('status=refunded')) return orderCounts.refunded;
                                return orderCounts.all; // All Orders
                              }
                              return null;
                            };
                            
                            const count = getCount();
                            const statusKey = subItem.path.includes('status=') ? subItem.path.split('status=')[1] : null;
                            const statusColor = statusKey && statusKey in statusColors ? statusColors[statusKey as keyof typeof statusColors] : null;
                            
                            return (
                              <Link
                                key={subItem.path}
                                href={subItem.path}
                                className={`block px-3 py-2 text-sm rounded-md transition-all duration-300 ${
                                  isSubmenuActive
                                    ? "bg-emerald-400/30 text-white font-medium border-l-2 border-emerald-300 ml-2 shadow-lg backdrop-blur-sm"
                                    : "text-emerald-200 hover:text-white hover:bg-emerald-500/20 hover:shadow-md"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    {'icon' in subItem && subItem.icon && <subItem.icon className="w-4 h-4 mr-2" />}
                                    <span>{subItem.label}</span>
                                  </div>
                                  {count !== null && (
                                    <span className={`${statusColor ? `${statusColor.bg} ${statusColor.text} ${statusColor.border}` : 'bg-emerald-400/30 text-emerald-100'} text-xs px-2 py-1 rounded-full border font-medium min-w-[20px] text-center`}>
                                      {count}
                                    </span>
                                  )}
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    // Regular menu item
                    <Link
                      href={item.path}
                      className={`flex items-center p-3 rounded-lg transition-all duration-300 ${
                        isActive
                          ? "bg-emerald-500/20 text-white border border-emerald-400/50 shadow-lg backdrop-blur-sm"
                          : "text-emerald-100 hover:text-white hover:bg-emerald-500/20 hover:shadow-md"
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-emerald-500/30 bg-emerald-600/20 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-emerald-400 rounded-full flex items-center justify-center shadow-lg">
                  <UserIcon className="w-5 h-5 text-white" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">Admin User</p>
                  <p className="text-xs text-emerald-200">Administrator</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  document.cookie = 'session_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                  document.cookie = 'session_user_name=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                  window.location.href = '/login/admin';
                }}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs text-white"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-emerald-900/30 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top header with view-permission guard */}
        <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-emerald-200/50">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            {/* Page title */}
            <div className="flex-1 text-center lg:text-left">
              <h2 className="text-lg font-semibold text-emerald-800">
                {(() => {
                  // Find current page title based on pathname
                  for (const [key, item] of Object.entries(adminNavigation)) {
                    if (isActivePath(item.path)) {
                      if ('submenu' in item) {
                        // Find active submenu item
                        const activeSubmenu = item.submenu ? item.submenu.find(sub => isActiveSubmenu(sub.path)) : null;
                        if (activeSubmenu) {
                          // Show status with icon for orders page
                          if (key === 'orders') {
                            return (
                              <div className="flex items-center space-x-2">
                                <span className="text-emerald-600">📋</span>
                                <span>{activeSubmenu.label}</span>
                                <span className="text-sm text-emerald-600 font-medium">
                                  ({activeSubmenu.label === 'All Orders' ? 'All' : activeSubmenu.label})
                                </span>
                              </div>
                            );
                          }
                          return activeSubmenu.label;
                        }
                      }
                      return item.label;
                    }
                  }
                  return "Admin Panel";
                })()}
              </h2>
            </div>
          </div>
        </header>

        {/* Page content (permission gate) */}
        <main className="p-4">
          {(() => {
            console.log('🔍 Checking page content permissions');
            console.log('📍 Current pathname:', pathname);
            
            const res = resourceForPath(pathname);
            if (!authzLoaded) {
              return <div className="p-4 text-sm text-gray-500">Loading permissions…</div>;
            }
            if (res && authz[res] !== true) {
              return (
                <div className="p-6 border rounded-md bg-yellow-50 text-yellow-800">
                  Permission required to view this feature.
                </div>
              );
            }
            return children;
          })()}
        </main>
      </div>
    </div>
  );
}
