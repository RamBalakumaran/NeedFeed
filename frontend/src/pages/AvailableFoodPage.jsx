// frontend/src/pages/AvailableFoodPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AvailableFoodPage.css'; // Import the new CSS

const AvailableFoodPage = () => {
  const [foods, setFoods] = useState([]);
  const [message, setMessage] = useState('');

  const fetchAvailableFoods = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/feed/available');
      setFoods(response.data);
    } catch (error) {
      setMessage('Could not fetch available food at this time.');
    }
  };

  useEffect(() => {
    fetchAvailableFoods();
  }, []);

  const handlePlaceOrder = async (id) => {
    try {
        await axios.post(`http://localhost:3001/api/feed/order/${id}`);
        setMessage('Order placed successfully! Please coordinate pickup.');
        fetchAvailableFoods(); // Refresh list after ordering
    } catch (error) {
        setMessage(error.response?.data?.message || 'Failed to place order.');
    }
  };

  return (
    <div className="available-food-container">
      <h1>Available Food for Pickup</h1>
      {message && <p className="no-food-message">{message}</p>}

      {foods.length > 0 ? (
        <div className="food-grid">
          {foods.map(food => (
            <div key={food.id} className="food-card">
              <h3>{food.foodName}</h3>
              <p><strong>Quantity:</strong> {food.quantity}</p>
              <p><strong>Location:</strong> {food.location}</p>
              <p><strong>Best Before:</strong> {new Date(food.expiry).toLocaleString()}</p>
              <button onClick={() => handlePlaceOrder(food.id)} className="claim-button">
                Claim Food
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-food-message">No food is currently available. Check back later!</p>
      )}
    </div>
  );
};

export default AvailableFoodPage;