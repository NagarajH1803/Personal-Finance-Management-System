import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import EMIManagement from './components/EMI/EMIManagement';
import AssetManagement from './components/Assets/AssetManagement';
import StockManagement from './components/Stocks/StockManagement';
import FixedDepositManagement from './components/FixedDeposits/FixedDepositManagement';
import GoldManagement from './components/Gold/GoldManagement';
import RentManagement from './components/Rent/RentManagement';
import MoneyLentManagement from './components/MoneyLent/MoneyLentManagement';
import CryptoManagement from './components/Crypto/CryptoManagement';
import ExpenseManagement from './components/Expenses/ExpenseManagement';
import ITRManagement from './components/ITR/ITRManagement';
import Profile from './components/Profile/Profile';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
};

// Main App Component
const AppContent = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Protected Routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="emi" element={<EMIManagement />} />
        <Route path="assets" element={<AssetManagement />} />
        <Route path="stocks" element={<StockManagement />} />
        <Route path="fixed-deposits" element={<FixedDepositManagement />} />
        <Route path="gold" element={<GoldManagement />} />
        <Route path="rent" element={<RentManagement />} />
        <Route path="money-lent" element={<MoneyLentManagement />} />
        <Route path="crypto" element={<CryptoManagement />} />
        <Route path="expenses" element={<ExpenseManagement />} />
        <Route path="itr" element={<ITRManagement />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

// Root App Component with Context Providers
const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
