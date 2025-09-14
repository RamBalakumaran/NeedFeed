import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './RequestFood.css'

const RequestFoodPage = () => {
  const [foods, setFoods] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { token } = useAuth();

  // ✅ Fetch only available food from correct backend route
  const fetchAvailableFoods = async () => {
  try {
    const response = await axios.get('http://localhost:3001/api/feed/available', {
      headers: { Authorization: `Bearer ${token}` },
    });
    setFoods(response.data);
  } catch (err) {
    setError('Could not fetch available food at this time.');
  }
};

  useEffect(() => {
    fetchAvailableFoods();
  }, []);

  // ✅ Call correct backend POST endpoint for requesting food
  const handleRequestFood = async (id) => {
    try {
      await axios.post(`http://localhost:3001/api/feed/order/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage('Request sent successfully! A volunteer will be assigned shortly.');
      setError('');
      fetchAvailableFoods(); // Refresh list to remove requested item
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send request.');
      setMessage('');
    }
  };

  return (
    <div className="available-food-container">
      <h1>Request Food</h1>
      <p>Browse available donations and make a request.</p>
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}

      {foods.length > 0 ? (
        <div className="food-grid">
          {foods.map(food => (
            <div key={food.id} className="food-card">
              <h3>{food.foodName}</h3>
              {food.photo && (
                <img
                  src={`http://localhost:3001/uploads/${food.photo}`}
                  alt={food.foodName}
                  className="food-image"
                />
              )}
              <p><strong>Quantity:</strong> {food.quantity}</p>
              <p><strong>Location:</strong> {food.location}</p>
              <p><strong>Best Before:</strong> {new Date(food.expiry).toLocaleString()}</p>
              <p><strong>Donor:</strong> {food.donor_name}</p>

              <button onClick={() => handleRequestFood(food.id)} className="claim-button">
                Request Food
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-food-message">No food is currently available. Please check back later!</p>
      )}
    </div>
  );
};

export default RequestFoodPage;
