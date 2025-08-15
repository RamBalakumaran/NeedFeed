
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DonationPage from './pages/DonationPage';
import AvailableFoodPage from './pages/AvailableFoodPage';
import Footer from './pages/Footer';

// --- Main Navigation Component with Scrolling Logic ---
const Navigation = () => {
  const { token, setAuthToken } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    setAuthToken(null);
    navigate('/login');
  };

  // This function handles the smooth scrolling to sections on the HomePage
  const handleScroll = (e, targetId) => {
    e.preventDefault(); // Prevent the default jumpy anchor link behavior

    // If we are not on the home page, navigate there first
    if (window.location.pathname !== '/') {
        navigate('/');
        // Wait a moment for React Router to render the HomePage before trying to scroll
        setTimeout(() => {
            document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    } else {
        // If we are already on the home page, just scroll smoothly
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="main-nav">
      <div className="nav-left">
        <Link to={token ? "/available" : "/"} className="nav-brand">
          NeedFeed
        </Link>
      </div>
      <div className="nav-right">
        {token ? (
          // === Links to show ONLY when the user is logged IN ===
          <>
            <Link to="/donate" className="nav-link">Donate Food</Link>
            <Link to="/available" className="nav-link">Available Food</Link>
            <button onClick={handleLogout} className="nav-button">Logout</button>
          </>
        ) : (
          // === Links to show ONLY when the user is logged OUT ===
          <>
            <Link to="/" className="nav-link">Home</Link>
            <a href="#how-it-works" className="nav-link" onClick={(e) => handleScroll(e, 'how-it-works')}>How It Works</a>
            <a href="#about" className="nav-link" onClick={(e) => handleScroll(e, 'about')}>About Us</a>
            <a href="#contact-us" className="nav-link" onClick={(e) => handleScroll(e, 'contact-us')}>Contact Us</a>
            <Link to="/login" className="nav-link">Login</Link>
          </>
        )}
      </div>
    </nav>
  );
};


// --- Main App Component that Defines the Application Structure and Routes ---
function App() {
  return (
    <AuthProvider>
      <Router>
        {/* The app-container helps with sticky footer placement */}
        <div className="app-container">
          <Navigation />
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected Routes - only accessible when logged in */}
              <Route element={<ProtectedRoute />}>
                <Route path="/donate" element={<DonationPage />} />
                <Route path="/available" element={<AvailableFoodPage />} />
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