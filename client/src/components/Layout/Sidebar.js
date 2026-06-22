import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  XMarkIcon,
  HomeIcon,
  CreditCardIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  BanknotesIcon,
  StarIcon,
  HomeModernIcon,
  DocumentTextIcon,
  UserIcon,
  CurrencyDollarIcon,
  ArrowRightOnRectangleIcon,
  HandRaisedIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline';

const iconMap = {
  HomeIcon,
  CreditCardIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  BanknotesIcon,
  StarIcon,
  HomeModernIcon,
  DocumentTextIcon,
  UserIcon,
  CurrencyDollarIcon,
  HandRaisedIcon,
  ComputerDesktopIcon,
};

const Sidebar = ({ navigation, sidebarOpen, setSidebarOpen, currentPath, isDesktop = false }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavItem = ({ item }) => {
    const Icon = iconMap[item.icon];
    const isActive = currentPath === item.href;
    
    return (
      <Link
        to={item.href}
        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
          isActive
            ? 'bg-primary-100 text-primary-900 border-r-2 border-primary-600'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <Icon
          className={`mr-3 h-6 w-6 flex-shrink-0 ${
            isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
          }`}
          aria-hidden="true"
        />
        {item.name}
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-white shadow-xl">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-gray-200">
        <div className="flex items-center">
          <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">F</span>
          </div>
          <span className="ml-3 text-xl font-semibold text-gray-900">Finance Manager</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        <nav className="flex-1 space-y-1 px-4 py-4">
          {navigation.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </nav>
      </div>

      {/* Logout */}
      <div className="border-t border-gray-200 p-4">
        <button
          onClick={handleLogout}
          className="group flex w-full items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <ArrowRightOnRectangleIcon className="mr-3 h-6 w-6 flex-shrink-0 text-gray-400 group-hover:text-gray-500" />
          Logout
        </button>
      </div>
    </div>
  );

  if (isDesktop) {
    return <SidebarContent />;
  }

  return (
    <Transition.Root show={sidebarOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-linear duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/80" />
        </Transition.Child>

        <div className="fixed inset-0 flex">
          <Transition.Child
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
              <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                <button
                  type="button"
                  className="-m-2.5 p-2.5"
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="sr-only">Close sidebar</span>
                  <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                </button>
              </div>
              <SidebarContent />
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default Sidebar;
