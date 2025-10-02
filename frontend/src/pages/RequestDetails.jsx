import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./RequestDetails.css";

export default function RequestDetails() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [details, setDetails] = useState(null);
  const [error, setError] = useState("");
  const [needVolunteer, setNeedVolunteer] = useState(false);
  const [volunteers, setVolunteers] = useState([]);
  const [loadingVolunteers, setLoadingVolunteers] = useState(false);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState(null);
  const [bookingStatus, setBookingStatus] = useState("");

  // Fetch request details
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await fetch(
          `http://localhost:3001/api/feed/request-details/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error("Failed to fetch request details.");
        const data = await res.json();
        setDetails(data);
        setNeedVolunteer(data.needVolunteer);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchDetails();
  }, [id, token]);

  // Fetch volunteers if needed
  useEffect(() => {
    if (!needVolunteer) {
      setVolunteers([]);
      setSelectedVolunteerId(null);
      return;
    }
    const fetchVolunteers = async () => {
      setLoadingVolunteers(true);
      try {
        const res = await fetch(
          `http://localhost:3001/api/feed/request/${id}/volunteers`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error("Failed to fetch volunteers.");
        const data = await res.json();
        setVolunteers(data.volunteers || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingVolunteers(false);
      }
    };
    fetchVolunteers();
  }, [needVolunteer, id, token]);

  // Handle booking food request
  const handleBookFood = async () => {
    if (details.requestStatus !== "Approved" && details.requestStatus !== "Pending") {
      alert("You can only claim this request after donor approval.");
      return;
    }

    if (needVolunteer && !selectedVolunteerId) {
      alert("Please select a volunteer before booking.");
      return;
    }

    setBookingStatus("Booking in progress...");
    try {
      const res = await fetch(`http://localhost:3001/api/feed/book-request/${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          needVolunteer,
          volunteerId: selectedVolunteerId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Booking failed.");

      setBookingStatus("Food booked successfully!");

      // Redirect to ThankYou page
      setTimeout(() => {
        navigate("/thankyou");
      }, 1000);
    } catch (err) {
      setBookingStatus(`Booking failed: ${err.message}`);
    }
  };

  // Handle marking delivery as received
  const handleMarkReceived = async () => {
    if (!details.deliveryId) {
      alert("Delivery info not available.");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:3001/api/feed/deliveries/${details.deliveryId}/delivered`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to mark as received.");

      alert("Delivery marked as received!");
      setDetails((prev) => ({
        ...prev,
        deliveryStatus: "Delivered",
        donationStatus: "delivered",
      }));
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  if (error) return <p className="error">{error}</p>;
  if (!details) return <p>Loading...</p>;

  return (
    <div className="request-details-container">
      <h2>🍽️ Claim Donation</h2>

      <section className="section">
        <h3>Food Details</h3>
        <p><strong>Item:</strong> {details.food.foodName}</p>
        <p><strong>Quantity:</strong> {details.food.quantity}</p>
        <p><strong>Expiry:</strong> {new Date(details.food.expiry).toLocaleDateString()}</p>
      </section>

      <section className="section">
        <h3>Donor Details</h3>
        <p><strong>Name:</strong> {details.donor.name}</p>
        <p><strong>Email:</strong> {details.donor.email}</p>
      </section>

      <section className="section">
        <h3>Volunteer Needed?</h3>
        <label>
          <input
            type="radio"
            checked={needVolunteer}
            onChange={() => setNeedVolunteer(true)}
          /> Yes
        </label>
        <label>
          <input
            type="radio"
            checked={!needVolunteer}
            onChange={() => setNeedVolunteer(false)}
          /> No
        </label>

        {needVolunteer && (
          <div className="volunteer-section">
            <h4>Select a Volunteer:</h4>
            {loadingVolunteers ? (
              <p>Finding nearby volunteers...</p>
            ) : volunteers.length === 0 ? (
              <p>No volunteers found nearby.</p>
            ) : (
              <ul>
                {volunteers.map((vol) => (
                  <li
                    key={vol.id}
                    className={selectedVolunteerId === vol.id ? "selected" : ""}
                    onClick={() => setSelectedVolunteerId(vol.id)}
                  >
                    {vol.name} ({vol.email}) - {vol.distance_km.toFixed(2)} km
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {/* Button logic */}
      {details.deliveryStatus === "Delivered" ? (
        <button className="book-button" disabled>Already Received</button>
      ) : details.deliveryStatus === "Assigned" || details.deliveryStatus === "PendingPickup" ? (
        <button className="book-button" onClick={handleMarkReceived}>Mark as Received</button>
      ) : (
        <button
          className="book-button"
          onClick={handleBookFood}
          disabled={!!bookingStatus}
        >
          {bookingStatus ? bookingStatus : "Confirm Booking"}
        </button>
      )}

      {bookingStatus && <p className="booking-status">{bookingStatus}</p>}
    </div>
  );
}
