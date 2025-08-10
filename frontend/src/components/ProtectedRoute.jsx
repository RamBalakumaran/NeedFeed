// frontend/src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { token } = useAuth();

  // If there's a token, show the page. Otherwise, redirect to login.
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;