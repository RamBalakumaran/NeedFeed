import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DonationPage from './pages/DonationPage';
import AvailableFoodPage from './pages/AvailableFoodPage';
import Footer from './pages/Footer';
import ProfilePage from './pages/ProfilePage';
import Navigation from "./components/Navigation"; // ✅ using the external file

// --- Main App Component ---
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Navigation />
          <main className="main-content">
            <Routes>
              {/* Default redirect to login */}
              <Route path="/" element={<Navigate to="/login" />} />

              {/* Public Routes */}
              <Route path="/home" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/donate" element={<DonationPage />} />
                <Route path="/available" element={<AvailableFoodPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
