import React, { useState } from 'react';
import axios from 'axios';
import './DonationPage.css';

const DonationPage = () => {
  const [formData, setFormData] = useState({
    foodName: '',
    quantity: '',
    expiry: '',
    location: '',
    packaging: '',
    foodTemperature: '',
    preparationDate: '',
    ingredients: '',
    storageCondition: '',
    instructions: '',
  });
  const [photo, setPhoto] = useState(null);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  const validateForm = () => {
    if (!formData.foodName.trim()) return 'Food Item(s) is required.';
    if (!formData.quantity.trim()) return 'Quantity is required.';
    if (!formData.expiry) return 'Expiry date is required.';
    if (new Date(formData.expiry) < new Date()) return 'Expiry date must be in the future.';
    if (!formData.location.trim()) return 'Pickup location is required.';
    if (!formData.packaging.trim()) return 'Packaging details are required for food safety.';
    if (!formData.foodTemperature.trim()) return 'Please specify the food temperature.';
    if (!formData.preparationDate) return 'Preparation date is required.';
    if (new Date(formData.preparationDate) > new Date()) return 'Preparation date cannot be in the future.';
    if (!formData.storageCondition.trim()) return 'Storage condition is required.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setMessage(validationError);
      setIsError(true);
      return;
    }

    const expiryDate = new Date(formData.expiry);
    const preparationDate = new Date(formData.preparationDate);

    const formattedExpiry = expiryDate.toISOString().slice(0, 19).replace('T', ' ');
    const formattedPreparation = preparationDate.toISOString().slice(0, 19).replace('T', ' ');

    const submissionData = new FormData();
    // ❌ remove user_id from frontend
    submissionData.append('foodName', formData.foodName);
    submissionData.append('quantity', formData.quantity);
    submissionData.append('expiry', formattedExpiry);
    submissionData.append('location', formData.location);
    submissionData.append('packagingDetails', formData.packaging);
    submissionData.append('foodTemperature', formData.foodTemperature);
    submissionData.append('preparationDate', formattedPreparation);
    submissionData.append('ingredientsAllergens', formData.ingredients);
    submissionData.append('storageCondition', formData.storageCondition);
    submissionData.append('instructions', formData.instructions);
    if (photo) submissionData.append('photo', photo);

    try {
      const token = localStorage.getItem("token"); // ✅ JWT token from login
      await axios.post("http://localhost:3001/api/feed/donate", submissionData, {
        headers: {
          Authorization: `Bearer ${token}`, // ✅ attach token
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage("Donation posted successfully! Thank you for your contribution.");
      setIsError(false);
      setFormData({
        foodName: '',
        quantity: '',
        expiry: '',
        location: '',
        packaging: '',
        foodTemperature: '',
        preparationDate: '',
        ingredients: '',
        storageCondition: '',
        instructions: '',
      });
      setPhoto(null);
      document.getElementById('photo').value = '';
    } catch (error) {
      console.error("DONATION ERROR:", error.response?.data || error.message);
      setMessage(error.response?.data?.message || 'Failed to create donation. Please try again.');
      setIsError(true);
    }
  };

  return (
    <div className="donation-page-container">
      <div className="donation-form-card">
        <h1>Donate Your Surplus Food</h1>
        <p>Your contribution can make a real difference in someone's life.</p>
        <form onSubmit={handleSubmit} encType="multipart/form-data">

          <div className="form-group">
            <label htmlFor="foodName">Food Item(s)</label>
            <input
              id="foodName"
              name="foodName"
              value={formData.foodName}
              onChange={handleChange}
              placeholder="e.g., Vegetable Biryani, Bread Loaves"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="quantity">Quantity</label>
            <input
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              placeholder="e.g., 5 plates, 2 packets"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="expiry">Best Before</label>
            <input
              id="expiry"
              name="expiry"
              type="datetime-local"
              value={formData.expiry}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">Pickup Location</label>
            <input
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., Anna Nagar, Chennai"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="packaging">Packaging Details</label>
            <input
              id="packaging"
              name="packaging"
              value={formData.packaging}
              onChange={handleChange}
              placeholder="e.g., Sealed containers, wrapped plates"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="foodTemperature">Food Temperature</label>
            <select
              id="foodTemperature"
              name="foodTemperature"
              value={formData.foodTemperature}
              onChange={handleChange}
              required
            >
              <option value="">Select temperature</option>
              <option value="Hot">Hot</option>
              <option value="Warm">Warm</option>
              <option value="Room Temperature">Room Temperature</option>
              <option value="Cold">Cold</option>
              <option value="Frozen">Frozen</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="preparationDate">Preparation Date</label>
            <input
              id="preparationDate"
              name="preparationDate"
              type="datetime-local"
              value={formData.preparationDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="ingredients">Ingredients / Allergens</label>
            <textarea
              id="ingredients"
              name="ingredients"
              value={formData.ingredients}
              onChange={handleChange}
              placeholder="List ingredients and allergens, e.g., nuts, dairy, gluten"
              rows={3}
            />
          </div>

          <div className="form-group">
  <label htmlFor="foodType">Food Type</label>
  <select
    id="foodType"
    name="foodType"
    value={formData.foodType}
    onChange={handleChange}
    required
  >
    <option value="">Select type</option>
    <option value="Vegetarian">Vegetarian</option>
    <option value="Non-veg">Non-veg</option>
    <option value="Packaged">Packaged</option>
    <option value="Cooked">Cooked</option>
  </select>
</div>

          <div className="form-group">
            <label htmlFor="storageCondition">Storage Condition</label>
            <input
              id="storageCondition"
              name="storageCondition"
              value={formData.storageCondition}
              onChange={handleChange}
              placeholder="e.g., Refrigerated, Room Temp, Frozen"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="instructions">Special Instructions (optional)</label>
            <textarea
              id="instructions"
              name="instructions"
              value={formData.instructions}
              onChange={handleChange}
              placeholder="e.g., Consume within 2 hours, Contains nuts"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="photo">Upload Photo (optional)</label>
            <input
              id="photo"
              name="photo"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
            />
          </div>

          <button type="submit" className="donate-button">Post Donation</button>
        </form>

        {message && (
          <p className={`form-message ${isError ? 'error' : 'success'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default DonationPage;
