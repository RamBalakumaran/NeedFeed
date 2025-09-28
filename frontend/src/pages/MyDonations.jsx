// src/pages/MyDonationsPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './MyDonationsPage.css'; // Create this CSS file

const MyDonationsPage = () => {
  const { token } = useAuth();
  const [donations, setDonations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMyDonations = async () => {
      try {
        // This endpoint should be protected and return only the donations for the logged-in user
        const response = await axios.get('http://localhost:3001/api/feed/mydonations', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDonations(response.data);
      } catch (err) {
        setError('Could not fetch your donations. Please try again later.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyDonations();
  }, [token]);

  return (
    <div className="my-donations-container">
      <h1>My Donation History</h1>
      {isLoading && <p>Loading your donations...</p>}
      {error && <p className="error-message">{error}</p>}
      {!isLoading && !error && donations.length > 0 ? (
        <div className="donations-grid">
          {donations.map(donation => (
            <div key={donation.id} className={`donation-card-history status-${donation.status.toLowerCase()}`}>
              {donation.photo && (
                <img
                  src={`http://localhost:3001/uploads/${donation.photo}`}
                  alt={donation.foodName}
                  className="donation-history-image"
                />
              )}
              <div className="donation-history-content">
                <h3>{donation.foodName}</h3>
                <p><strong>Quantity:</strong> {donation.quantity}</p>
                <p><strong>Date Posted:</strong> {new Date(donation.preparationDate).toLocaleString()}</p>
                <p><strong>Best Before :</strong> {new Date(donation.expiry).toLocaleString()}</p>
                <p><strong>Location :</strong> {donation.location}</p>
                <div className="donation-status">
                  <strong>Status:</strong> <span>{donation.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !isLoading && <p>You haven't made any donations yet.</p>
      )}
    </div>
  );
};

export default MyDonationsPage;