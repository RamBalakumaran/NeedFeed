import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // make sure setAuthToken and setUser are provided here
import './LoginPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const { setAuthToken, setUser } = useAuth(); //  get setUser
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault(); //  prevent default form submit
    try {
      const response = await axios.post("http://localhost:3001/api/user/login", {
        email,
        password
      });

      const { token, user } = response.data;
      localStorage.setItem("token", token);
      setAuthToken(token);     // save token to context
      setUser(user);           //  save user to context

    
        navigate("/available");
      

    } catch (error) {
      console.error("Login failed:", error);
      setMessage("Invalid email or password");
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-form-container">
        <h1>NeedFeed</h1>
        <h2>Welcome Back!</h2>

        <form onSubmit={handleLogin}>
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
          <button type="submit" className="login-button">Login</button>
        </form>

        {message && <p style={{ color: 'red', marginTop: '1rem' }}>{message}</p>}

        <p className="register-link">
          Don't have an account? <Link to="/register">Register Here</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
