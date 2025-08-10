// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Footer from './pages/Footer'; // New Import

// Import Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DonationPage from './pages/DonationPage';
import AvailableFoodPage from './pages/AvailableFoodPage';

// Main Navigation Component (no changes here)
const Navigation = () => {
  const { token, setAuthToken } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    setAuthToken(null);
    navigate('/login');
  };

  const handleScroll = (e, targetId) => {
    e.preventDefault();
    if (window.location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
            document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    } else {
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="main-nav">
      <div className="nav-left">
        <Link to={token ? "/available" : "/"} className="nav-brand">NeedFeed</Link>
      </div>
      <div className="nav-right">
        {token ? (
          <>
            <Link to="/donate" className="nav-link">Donate Food</Link>
            <Link to="/available" className="nav-link">Available Food</Link>
            <button onClick={handleLogout} className="nav-button">Logout</button>
          </>
        ) : (
          <>
            <Link to="/" className="nav-link">Home</Link>
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

// Main App Structure
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Navigation />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/donate" element={<DonationPage />} />
                <Route path="/available" element={<AvailableFoodPage />} />
              </Route>
            </Routes>
          </main>
          <Footer /> {/* <-- ADDED FOOTER COMPONENT HERE */}
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;