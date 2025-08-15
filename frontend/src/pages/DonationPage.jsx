import React, { useState } from 'react';
import axios from 'axios';
import './DonationPage.css';

const DonationPage = () => {
  const [formData, setFormData] = useState({ foodName: '', quantity: '', expiry: '', location: '' });
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const expiryDate = new Date(formData.expiry);
    const formattedExpiry = expiryDate.toISOString().slice(0, 19).replace('T', ' ');
    const submissionData = { ...formData, expiry: formattedExpiry };

    try {
      await axios.post('http://localhost:3001/api/feed/donate', submissionData);
      setMessage('Donation posted successfully! Thank you for your contribution.');
      setIsError(false);
      setFormData({ foodName: '', quantity: '', expiry: '', location: '' });
    } catch (error) {
      setMessage('Failed to create donation. Please try again.');
      setIsError(true);
    }
  };

  return (
    <div className="donation-page-container">
      <div className="donation-form-card">
        <h1>Donate Your Surplus Food</h1>
        <p>Your contribution can make a real difference in someone's life.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="foodName">Food Item(s)</label>
            <input id="foodName" name="foodName" value={formData.foodName} onChange={handleChange} placeholder="e.g., Vegetable Biryani, Bread Loaves" required />
          </div>
          <div className="form-group">
            <label htmlFor="quantity">Quantity</label>
            <input id="quantity" name="quantity" value={formData.quantity} onChange={handleChange} placeholder="e.g., 5 plates, 2 packets" required />
          </div>
          <div className="form-group">
            <label htmlFor="expiry">Best Before</label>
            <input id="expiry" name="expiry" type="datetime-local" value={formData.expiry} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="location">Pickup Location</label>
            <input id="location" name="location" value={formData.location} onChange={handleChange} placeholder="e.g., Anna Nagar, Chennai" required />
          </div>
          <button type="submit" className="donate-button">Post Donation</button>
        </form>
        {message && <p className={`form-message ${isError ? 'error' : 'success'}`}>{message}</p>}
      </div>
    </div>
  );
};

export default DonationPage;