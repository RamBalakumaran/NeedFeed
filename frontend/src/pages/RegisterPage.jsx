// frontend/src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

// Import the new CSS file
import './RegisterPage.css';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3001/api/user/register', { email, password });
      setMessage("Registration successful! Redirecting to login...");
      // Redirect to login page on successful registration after a short delay
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="register-page-container">
      <div className="register-form-container">
        <h1>NeedFeed</h1>
        <h2>Join Our Community</h2>

        <form onSubmit={handleRegister}>
          <div className="input-group">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email Address"
              required
            />
          </div>
          <div className="input-group">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
          </div>
          <button type="submit" className="register-button">Create Account</button>
        </form>

        {message && <p style={{ color: message.includes('successful') ? 'green' : 'red', marginTop: '1rem' }}>{message}</p>}

        <p className="login-link">
          Already have an account? <Link to="/login">Login Here</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;