import React, { useState, useEffect } from "react";
import axios from "axios";
import "./DonationPage.css";

const DonationPage = () => {
  const [formData, setFormData] = useState({
    foodName: "",
    quantity: "",
    expiry: "",
    location: "",
    packagingDetails: "",
    foodTemperature: "",
    preparationDate: "",
    ingredientsAllergens: "",
    storageCondition: "",
    instructions: "",
    foodType: "",
    latitude: "",
    longitude: "",
  });

  const [photo, setPhoto] = useState(null);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

useEffect(() => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData(prev => ({
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) setPhoto(e.target.files[0]);
  };

  // Validation for required fields
  const validateForm = () => {
    if (!formData.foodName.trim()) return "Food Item(s) is required.";
    if (!formData.quantity.trim()) return "Quantity is required.";
    if (!formData.expiry) return "Expiry date is required.";
    if (new Date(formData.expiry) < new Date())
      return "Expiry date must be in the future.";
    if (!formData.location.trim()) return "Pickup location is required.";
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

    const submissionData = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value) submissionData.append(key, value);
    });
    if (photo) submissionData.append("photo", photo);

    try {
      const token = localStorage.getItem("token"); // JWT token from login
      await axios.post("http://localhost:3001/api/feed/donate", submissionData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage("Donation posted successfully! Thank you for your contribution.");
      setIsError(false);
      setFormData({
        foodName: "",
        quantity: "",
        expiry: "",
        location: "",
        packagingDetails: "",
        foodTemperature: "",
        preparationDate: "",
        ingredientsAllergens: "",
        storageCondition: "",
        instructions: "",
        foodType: "",
        latitude: "",
        longitude: "",
      });
      setPhoto(null);
      document.getElementById("photo").value = "";
    } catch (error) {
      console.error("DONATION ERROR:", error.response?.data || error.message);
      setMessage(error.response?.data?.message || "Failed to create donation.");
      setIsError(true);
    }
  };

  return (
    <div className="donation-page-container">
      <div className="donation-form-card">
        <h1>Donate Your Surplus Food</h1>
        <p>Your contribution can make a real difference in someone's life.</p>

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          {/* Food Name */}
          <div className="form-group">
            <label>Food Item(s) *</label>
            <input
              name="foodName"
              value={formData.foodName}
              onChange={handleChange}
              placeholder="e.g., Vegetable Biryani"
              required
            />
          </div>

          {/* Quantity */}
          <div className="form-group">
            <label>Quantity *</label>
            <input
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              placeholder="e.g., 5 plates"
              required
            />
          </div>

          {/* Expiry */}
          <div className="form-group">
            <label>Best Before *</label>
            <input
              name="expiry"
              type="datetime-local"
              value={formData.expiry}
              onChange={handleChange}
              required
            />
          </div>

          {/* Pickup Location */}
          <div className="form-group">
            <label>Pickup Location *</label>
            <input
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., Anna Nagar, Chennai"
              required
            />
          </div>

          {/* Optional Fields */}
          <div className="form-group">
            <label>Packaging Details</label>
            <input
              name="packagingDetails"
              value={formData.packagingDetails}
              onChange={handleChange}
              placeholder="e.g., Sealed containers"
            />
          </div>

          <div className="form-group">
            <label>Food Temperature</label>
            <select name="foodTemperature" value={formData.foodTemperature} onChange={handleChange}>
              <option value="">Select temperature</option>
              <option value="Hot">Hot</option>
              <option value="Warm">Warm</option>
              <option value="Room Temperature">Room Temperature</option>
              <option value="Cold">Cold</option>
              <option value="Frozen">Frozen</option>
            </select>
          </div>

          <div className="form-group">
            <label>Preparation Date</label>
            <input
              name="preparationDate"
              type="datetime-local"
              value={formData.preparationDate}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Ingredients / Allergens</label>
            <textarea
              name="ingredientsAllergens"
              value={formData.ingredientsAllergens}
              onChange={handleChange}
              placeholder="e.g., nuts, dairy"
              rows={2}
            />
          </div>

          <div className="form-group">
            <label>Storage Condition</label>
            <input
              name="storageCondition"
              value={formData.storageCondition}
              onChange={handleChange}
              placeholder="e.g., Refrigerated"
            />
          </div>

          <div className="form-group">
            <label>Special Instructions</label>
            <textarea
              name="instructions"
              value={formData.instructions}
              onChange={handleChange}
              rows={2}
            />
          </div>

          <div className="form-group">
            <label>Food Type</label>
            <select name="foodType" value={formData.foodType} onChange={handleChange}>
              <option value="">Select type</option>
              <option value="Vegetarian">Vegetarian</option>
              <option value="Non-veg">Non-veg</option>
              <option value="Packaged">Packaged</option>
              <option value="Cooked">Cooked</option>
            </select>
          </div>

          <div className="form-group">
            <label>Upload Photo</label>
            <input id="photo" name="photo" type="file" accept="image/*" onChange={handlePhotoChange} />
          </div>

          <button type="submit" className="donate-button">
            Post Donation
          </button>
        </form>

        {message && (
          <p className={`form-message ${isError ? "error" : "success"}`}>{message}</p>
        )}
      </div>
    </div>
  );
};

export default DonationPage;
