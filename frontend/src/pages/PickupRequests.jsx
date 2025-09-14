import React, { useEffect, useState } from "react";
import "./PickupRequests.css";

export default function PickupRequests() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/pickup-requests", {
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => setRequests(data))
      .catch((err) => console.error("Error fetching pickup requests:", err));
  }, []);

  const handleAccept = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:5000/api/pickup-requests/${id}/accept`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      setRequests((prev) =>
        prev.map((req) =>
          req.id === id ? { ...req, status: "Accepted" } : req
        )
      );
    } catch (err) {
      console.error("Error accepting pickup request:", err);
    }
  };

  return (
    <div className="pickup-container">
      <h2>Pickup Requests</h2>
      {requests.length === 0 ? (
        <p>No pickup requests available right now.</p>
      ) : (
        <div className="pickup-grid">
          {requests.map((req) => (
            <div key={req.id} className="pickup-card">
              <h3>{req.foodName}</h3>
              <p><strong>Quantity:</strong> {req.quantity}</p>
              <p><strong>Pickup Location:</strong> {req.location}</p>
              <p><strong>Status:</strong> {req.status}</p>
              {req.status !== "Accepted" && (
                <button
                  className="accept-btn"
                  onClick={() => handleAccept(req.id)}
                >
                  Accept Pickup
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
