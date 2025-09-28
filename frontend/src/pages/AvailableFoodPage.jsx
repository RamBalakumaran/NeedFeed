import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './AvailableFoodPage.css';

// Debounce hook to avoid excessive API calls
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

const AvailableFoodPage = () => {
  const [foods, setFoods] = useState([]);
  const [message, setMessage] = useState('');
  const [filters, setFilters] = useState({
    foodName: '',
    location: '',
    donor: '',
  });
  const [radiusKm, setRadiusKm] = useState('');
  const [userLocation, setUserLocation] = useState({ lat: null, lng: null });
  const [mapLocation, setMapLocation] = useState(null); // store lat/lng for map popup

  const debouncedFilters = useDebounce(filters, 500);

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => console.error("Geolocation error:", err)
      );
    }
  }, []);

  // Fetch foods from backend
  const fetchAvailableFoods = useCallback(async (currentFilters) => {
    try {
      const response = await axios.get('http://localhost:3001/api/feed/available', {
        params: currentFilters,
      });
      setFoods(response.data);
      if (response.data.length === 0) setMessage('No food available for the selected filters.');
      else setMessage('');
    } catch (error) {
      console.error("Fetch error:", error);
      setMessage('Could not fetch available food at this time.');
      setFoods([]);
    }
  }, []);

  // Update foods whenever filters or radius change
  useEffect(() => {
    const activeFilters = Object.entries(debouncedFilters).reduce((acc, [key, value]) => {
      if (value) acc[key] = value;
      return acc;
    }, {});

    // === CHANGE HERE: Parse radiusKm to float to ensure numeric value for backend ===
    if (userLocation.lat && userLocation.lng && radiusKm) {
      activeFilters.userLat = userLocation.lat;
      activeFilters.userLng = userLocation.lng;
      activeFilters.radiusKm = parseFloat(radiusKm); // <-- CHANGED
    }

    fetchAvailableFoods(activeFilters);
  }, [debouncedFilters, radiusKm, userLocation, fetchAvailableFoods]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const openMap = (lat, lng) => {
    setMapLocation({ lat, lng });
  };

  const closeMap = () => setMapLocation(null);

  return (
    <div className="available-food-container">
      <h1>Available Food for Pickup</h1>

      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          name="foodName"
          placeholder="Filter by food name"
          value={filters.foodName}
          onChange={handleFilterChange}
        />
        <input
          type="text"
          name="location"
          placeholder="Filter by location"
          value={filters.location}
          onChange={handleFilterChange}
        />
        <input
          type="text"
          name="donor"
          placeholder="Filter by donor"
          value={filters.donor}
          onChange={handleFilterChange}
        />
        <input
          type="number"
          name="radiusKm"
          placeholder="Nearby (km)"
          value={radiusKm}
          onChange={(e) => setRadiusKm(e.target.value)}
        />
      </div>

      {message && <p className="no-food-message">{message}</p>}

      {/* Food cards grid */}
      {foods.length > 0 && (
        <div className="food-card-grid">
          {foods.map(food => (
            <div key={food.id} className="food-card">
              {food.photo && (
                <img
                  src={`http://localhost:3001/uploads/${food.photo}`}
                  alt={food.foodName}
                  className="food-card-img"
                />
              )}
              <div className="food-card-body">
                <h3 className="food-title">{food.foodName}</h3>
                <div className="food-details">
                  <p><strong>Quantity:</strong> {food.quantity}</p>
                  <p><strong>Location:</strong> {food.location}</p>
                  <p><strong>Posted At:</strong> {new Date(food.preparationDate).toLocaleString()}</p>
                  <p><strong>Best Before:</strong> {new Date(food.expiry).toLocaleString()}</p>
                  <p><strong>Donor:</strong> {food.donor_name}</p>
                  <p><strong>Email:</strong> {food.donor_email}</p>
                </div>
                {food.latitude && food.longitude && (
                  <button
                    className="map-toggle-btn"
                    onClick={() => openMap(food.latitude, food.longitude)}
                  >
                    Show Map
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Map Popup Modal */}
      {mapLocation && (
        <div className="map-modal-overlay" onClick={closeMap}>
          <div className="map-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-map-btn" onClick={closeMap}>✖</button>
            <iframe
              title="map-view"
              width="100%"
              height="400"
              frameBorder="0"
              style={{ border: 0, borderRadius: "8px" }}
              src={`https://www.google.com/maps?q=${mapLocation.lat},${mapLocation.lng}&z=17&output=embed`}
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailableFoodPage;
