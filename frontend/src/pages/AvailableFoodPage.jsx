import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AvailableFoodPage.css';

const AvailableFoodPage = () => {
  const [foods, setFoods] = useState([]);
  const [filteredFoods, setFilteredFoods] = useState([]);
  const [message, setMessage] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'expiry', direction: 'asc' });
  const [filters, setFilters] = useState({
    foodName: '',
    location: '',
    donor: '',
  });

  const fetchAvailableFoods = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/feed/available');
      setFoods(response.data);
      setFilteredFoods(response.data);
    } catch (error) {
      setMessage('Could not fetch available food at this time.');
    }
  };

  useEffect(() => {
    fetchAvailableFoods();
  }, []);

  // Filter foods based on filters state
  useEffect(() => {
    let filtered = [...foods];

    if (filters.foodName) {
      filtered = filtered.filter(food =>
        food.foodName.toLowerCase().includes(filters.foodName.toLowerCase())
      );
    }

    if (filters.location) {
      filtered = filtered.filter(food =>
        food.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.donor) {
      filtered = filtered.filter(food =>
        food.donor_name.toLowerCase().includes(filters.donor.toLowerCase())
      );
    }

    setFilteredFoods(filtered);
  }, [filters, foods]);

  // Sorting function
  const sortedFoods = React.useMemo(() => {
    let sortableFoods = [...filteredFoods];
    if (sortConfig !== null) {
      sortableFoods.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // For expiry date, convert to Date for comparison
        if (sortConfig.key === 'expiry') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        } else {
          // Convert to lowercase string for string comparison
          aValue = aValue ? aValue.toString().toLowerCase() : '';
          bValue = bValue ? bValue.toString().toLowerCase() : '';
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableFoods;
  }, [filteredFoods, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === 'asc'
    ) {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortArrow = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
    }
    return '';
  };

  return (
    <div className="available-food-container">
      <h1>Available Food for Pickup</h1>

      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          placeholder="Filter by food name"
          value={filters.foodName}
          onChange={(e) => setFilters({ ...filters, foodName: e.target.value })}
        />
        <input
          type="text"
          placeholder="Filter by location"
          value={filters.location}
          onChange={(e) => setFilters({ ...filters, location: e.target.value })}
        />
        <input
          type="text"
          placeholder="Filter by donor"
          value={filters.donor}
          onChange={(e) => setFilters({ ...filters, donor: e.target.value })}
        />
      </div>

      {message && <p className="no-food-message">{message}</p>}

      {sortedFoods.length > 0 ? (
        <table className="food-table">
          <thead>
            <tr>
              <th onClick={() => requestSort('foodName')}>Food Name{getSortArrow('foodName')}</th>
              <th>Photo</th>
              <th onClick={() => requestSort('quantity')}>Quantity{getSortArrow('quantity')}</th>
              <th onClick={() => requestSort('location')}>Location{getSortArrow('location')}</th>
              <th onClick={() => requestSort('expiry')}>Best Before{getSortArrow('expiry')}</th>
              <th onClick={() => requestSort('donor_name')}>Donor{getSortArrow('donor_name')}</th>
              <th onClick={() => requestSort('donor_email')}>Email{getSortArrow('donor_email')}</th>
            </tr>
          </thead>
          <tbody>
            {sortedFoods.map(food => (
              <tr key={food.id}>
                <td>{food.foodName}</td>
                <td>
                  {food.photo && (
                    <img
                      src={`http://localhost:3001/uploads/${food.photo}`}
                      alt={food.foodName}
                      className="food-thumbnail"
                    />
                  )}
                </td>
                <td>{food.quantity}</td>
                <td>{food.location}</td>
                <td>{new Date(food.expiry).toLocaleString()}</td>
                <td>{food.donor_name}</td>
                <td> {food.donor_email && `${food.donor_email}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="no-food-message">No food is currently available. Check back later!</p>
      )}
    </div>
  );
};

export default AvailableFoodPage;
