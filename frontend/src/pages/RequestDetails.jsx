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

  // Fetch request + donation + donor details
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
        setNeedVolunteer(data.needVolunteer === 1);
      } catch (err) {
        console.error(err);
        setError(err.message);
      }
    };
    fetchDetails();
  }, [id, token]);

  // Update backend when user toggles “Need Volunteer”
  useEffect(() => {
    const updateNeedVolunteer = async () => {
      if (!details?.food?.id) return;
      try {
        await fetch(
          `http://localhost:3001/api/feed/request/${details.food.id}/need-volunteer`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ needVolunteer }),
          }
        );
      } catch (err) {
        console.error("Failed to update needVolunteer:", err.message);
      }
    };
    updateNeedVolunteer();
  }, [needVolunteer, token, details]);

  // Fetch nearby volunteers
  useEffect(() => {
    if (!needVolunteer || !details?.food?.id) {
      setVolunteers([]);
      setSelectedVolunteerId(null);
      return;
    }

    const fetchVolunteers = async () => {
      setLoadingVolunteers(true);
      try {
        const res = await fetch(
          `http://localhost:3001/api/feed/request/${details.food.id}/volunteers`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch volunteers.");
        setVolunteers(data.volunteers || []);
      } catch (err) {
        console.error("Error fetching volunteers:", err);
        setError(err.message);
      } finally {
        setLoadingVolunteers(false);
      }
    };
    fetchVolunteers();
  }, [needVolunteer, token, details]);

  // Handle booking (claim donation)
 const handleBookFood = async () => {
  if (!details) return;

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
    const res = await fetch(
      `http://localhost:3001/api/feed/book-request/${id}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          volunteerId: needVolunteer ? selectedVolunteerId : null,
        }),
      }
    );

    const data = await res.json();

    if (res.status === 409) {
      alert(data.message); // Delivery already exists
      return;
    }

    if (!res.ok) throw new Error(data.message || "Booking failed.");

    alert("✅ Food booked successfully!");
    navigate("/myrequests");
  } catch (err) {
    alert("Booking failed: " + err.message);
  } finally {
    setBookingStatus("");
  }
};
  // Handle marking as received
  const handleMarkReceived = async () => {
    if (!details?.deliveryId) {
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

      alert("✅ Delivery marked as received!");
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
  if (!details) return <p>Loading details...</p>;

  return (
    <div className="request-details-container">
      <h2>🍽️ Claim Donation</h2>

      <section className="section">
        <h3>Food Details</h3>
        <p><strong>Item:</strong> {details.food?.foodName}</p>
        <p><strong>Quantity:</strong> {details.food?.quantity}</p>
        <p><strong>Expiry:</strong> {new Date(details.food?.expiry).toLocaleString()}</p>
      </section>

      <section className="section">
        <h3>Donor Details</h3>
        <p><strong>Name:</strong> {details.donor?.name}</p>
        <p><strong>Email:</strong> {details.donor?.email}</p>
      </section>

      <section className="section">
        <h3>Need Volunteer?</h3>
        <label className="radio-label">
          <input
            type="radio"
            checked={needVolunteer}
            onChange={() => setNeedVolunteer(true)}
          /> Yes
        </label>
        <label className="radio-label">
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
              <div className="volunteer-cards">
                {volunteers.map((vol) => (
                  <div
                    key={vol.volunteerId}
                    className={`volunteer-card ${selectedVolunteerId === vol.volunteerId ? "selected" : ""}`}
                    onClick={() => setSelectedVolunteerId(vol.volunteerId)}
                  >
                    <p><strong>{vol.name}</strong></p>
                    <p>{vol.email}</p>
                    <p>{vol.distanceKm?.toFixed(2)} km away</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <button
        className="book-button"
        onClick={handleBookFood}
        disabled={!!bookingStatus}
      >
        {bookingStatus || "Confirm Booking"}
      </button>

      {(details.deliveryStatus === "Assigned" || details.deliveryStatus === "PendingPickup") && (
        <button className="book-button" onClick={handleMarkReceived}>
          Mark as Received
        </button>
      )}
    </div>
  );
}
