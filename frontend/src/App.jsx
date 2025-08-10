// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Import all necessary page components
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DonationPage from './pages/DonationPage';
import AvailableFoodPage from './pages/AvailableFoodPage';
// NOTE: We no longer import ServicePage, AboutUsPage, or ContactPage here.

// --- Main Navigation Component with Scrolling Logic ---
const Navigation = () => {
  const { token, setAuthToken } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    setAuthToken(null);
    navigate('/login');
  };

  // This function handles the smooth scrolling
  const handleScroll = (e, targetId) => {
    e.preventDefault(); // Prevent the default jumpy anchor link behavior
    
    // If we are not on the home page, navigate there first
    if (window.location.pathname !== '/') {
        navigate('/');
        // Wait a moment for the page to change before trying to scroll
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
            {/* These are now anchor links that trigger the scroll function */}
            <a href="#service" className="nav-link" onClick={(e) => handleScroll(e, 'service')}>Service</a>
            <a href="#about-us" className="nav-link" onClick={(e) => handleScroll(e, 'about-us')}>About Us</a>
            <a href="#contact-us" className="nav-link" onClick={(e) => handleScroll(e, 'contact-us')}>Contact Us</a>
            <Link to="/login" className="nav-link">Login</Link>
          </>
        )}
      </div>
    </nav>
  );
};


// --- Main App Component that Defines the Structure and Routes ---
function App() {
  return (
    <AuthProvider>
      <Router>
        <Navigation />
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
      </Router>
    </AuthProvider>
  );
}

export default App;