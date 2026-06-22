import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: 'HomeIcon' },
    { name: 'EMI Management', href: '/emi', icon: 'CreditCardIcon' },
    { name: 'Assets', href: '/assets', icon: 'BuildingOfficeIcon' },
    { name: 'Stocks', href: '/stocks', icon: 'ChartBarIcon' },
    { name: 'Fixed Deposits', href: '/fixed-deposits', icon: 'BanknotesIcon' },
    { name: 'Gold', href: '/gold', icon: 'StarIcon' },
    { name: 'Rent', href: '/rent', icon: 'HomeModernIcon' },
    { name: 'Money Lent', href: '/money-lent', icon: 'HandRaisedIcon' },
    { name: 'Crypto', href: '/crypto', icon: 'ComputerDesktopIcon' },
    { name: 'Expenses', href: '/expenses', icon: 'CurrencyDollarIcon' },
    { name: 'ITR', href: '/itr', icon: 'DocumentTextIcon' },
    { name: 'Profile', href: '/profile', icon: 'UserIcon' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar for mobile */}
      <Sidebar
        navigation={navigation}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        currentPath={location.pathname}
      />

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <Sidebar
          navigation={navigation}
          sidebarOpen={true}
          setSidebarOpen={setSidebarOpen}
          currentPath={location.pathname}
          isDesktop={true}
        />
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Header */}
        <Header
          user={user}
          setSidebarOpen={setSidebarOpen}
        />

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
