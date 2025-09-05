import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./OrderConfirmationPage.css";

const OrderConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const food = location.state?.order;

  if (!food) {
    return <p>No order details found.</p>;
  }

  // 👉 Function to open Google Maps with pickup location
  const handleSeeLocation = () => {
    if (food.location) {
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(food.location)}`;
      window.open(mapsUrl, "_blank");
    } else {
      alert("Pickup location not available.");
    }
  };

  // 👉 Function to claim donation
  const handleClaim = async () => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/feed/claim/${food.id}`, // make sure you have this backend route
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Claimed" }),
        }
      );

      if (response.ok) {
        alert(" Donation claimed successfully!");
        navigate("/"); // Go back to home after claiming
      } else {
        alert(" Failed to claim donation.");
      }
    } catch (error) {
      console.error("Error claiming donation:", error);
      alert(" Something went wrong.");
    }
  };

  return (
    <div className="order-container">
      <h1>Order Confirmation</h1>
      <div className="order-details">
        <p><b>Food:</b> {food.foodName}</p>
        <p><b>Quantity:</b> {food.quantity}</p>
        <p><b>Expires At:</b> {food.expiry ? new Date(food.expiry).toLocaleString() : "N/A"}</p>
        <p><b>Donor:</b> {food.donor_type || "Not Provided"}</p>
        <p><b>Donor Contact:</b> {food.preferred_contact || "Not Provided"}</p>
        <p><b>Pickup Location:</b> {food.location}</p>
        <p><b>Status:</b> {food.status}</p>
      </div>

      <div className="order-actions">
        <button className="btn-location" onClick={handleSeeLocation}>  See Location</button>
        <button className="btn-claim" onClick={handleClaim}>  Claim Donation</button>
        <button className="btn-back" onClick={() => navigate("/")}>  Back to Home</button>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
