import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './RegisterPage.css';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    city: '',
    pincode: '',
    role: '',
    latitude: '',
    longitude: '',

    donorType: '',
    foodType: '',
    availabilityTime: '',

    preferredArea: '',
    vehicleType: '',
    volunteerAvailability: '',

    ngoName: '',
    licenseNumber: '',
    capacity: '',
    ngoFoodType: ''
  });

  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // Auto fetch geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData((prev) => ({
            ...prev,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          }));
        },
        (err) => console.error("Geolocation error:", err)
      );
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:3001/api/user/register", formData);
      setMessage("Registration successful! Redirecting...");
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      setMessage(error.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="register-page-container">
      <div className="register-form-container">
        <h1>NeedFeed</h1>
        <h2>Join Our Community</h2>

        <form onSubmit={handleRegister}>
          <input name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" required />
          <input name="email" value={formData.email} onChange={handleChange} placeholder="Email" required />
          <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Password" required />
          <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone Number" required />
          <input name="address" value={formData.address} onChange={handleChange} placeholder="Address" required />
          <input name="city" value={formData.city} onChange={handleChange} placeholder="City" required />
          <input name="pincode" value={formData.pincode} onChange={handleChange} placeholder="Pincode" required />

          <select name="role" value={formData.role} onChange={handleChange} required>
            <option value="">Select Role</option>
            <option value="donor">Donor</option>
            <option value="volunteer">Volunteer</option>
            <option value="ngo">NGO</option>
          </select>

          {/* Donor Extra Fields */}
          {formData.role === "donor" && (
            <>
              <select name="donorType" value={formData.donorType} onChange={handleChange} required>
                <option value="">Donor Type</option>
                <option value="Restaurant">Restaurant</option>
                <option value="Wedding Hall">Wedding Hall</option>
                <option value="Individual">Individual</option>
              </select>
              <select name="foodType" value={formData.foodType} onChange={handleChange} required>
                <option value="">Food Type</option>
                <option value="Veg">Veg</option>
                <option value="Non-Veg">Non-Veg</option>
                <option value="Both">Both</option>
              </select>
              <input name="availabilityTime" value={formData.availabilityTime} onChange={handleChange} placeholder="Availability Time (e.g., 7–10 PM)" />
            </>
          )}

          {/* Volunteer Extra Fields */}
          {formData.role === "volunteer" && (
            <>
              <input name="preferredArea" value={formData.preferredArea} onChange={handleChange} placeholder="Preferred Area/Zone" />
              <select name="vehicleType" value={formData.vehicleType} onChange={handleChange}>
                <option value="">Vehicle Type</option>
                <option value="Bike">Bike</option>
                <option value="Car">Car</option>
                <option value="Van">Van</option>
                <option value="None">None</option>
              </select>
              <input name="volunteerAvailability" value={formData.volunteerAvailability} onChange={handleChange} placeholder="Availability (e.g., Daily 6–10 PM)" />
            </>
          )}

          {/* NGO Extra Fields */}
          {formData.role === "ngo" && (
            <>
              <input name="ngoName" value={formData.ngoName} onChange={handleChange} placeholder="NGO / Organization Name" />
              <input name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} placeholder="License / Reg Number" />
              <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} placeholder="Capacity (people served daily)" />
              <select name="ngoFoodType" value={formData.ngoFoodType} onChange={handleChange}>
                <option value="">Preferred Food</option>
                <option value="Veg">Veg</option>
                <option value="Non-Veg">Non-Veg</option>
                <option value="Both">Both</option>
              </select>
            </>
          )}

          <button type="submit" className="register-button">Create Account</button>
        </form>

        {message && <p style={{ color: message.includes("success") ? "green" : "red" }}>{message}</p>}
        <p className="login-link">Already have an account? <Link to="/login">Login</Link></p>
      </div>
    </div>
  );
};

export default RegisterPage;
