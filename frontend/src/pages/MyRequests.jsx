import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext"; // import your auth context
import "./MyRequests.css";

export default function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  const { token } = useAuth(); // Get token from context

  useEffect(() => {
    if (!token) return; // Wait until token is available

    fetch("http://localhost:3001/api/feed/my-requests", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // Add auth header
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch requests");
        return res.json();
      })
      .then((data) => setRequests(data))
      .catch((err) => {
        console.error("Error fetching requests:", err);
        setError("Could not load your requests.");
      });
  }, [token]);

  return (
    <div className="my-requests-container">
      <h2>My Food Requests</h2>
      {error && <p className="error-message">{error}</p>}
      {requests.length === 0 ? (
        <p>No requests found.</p>
      ) : (
        <ul>
          {requests.map((req) => (
            <li key={req.id} className="request-card">
              <strong>{req.foodName}</strong>{" "}
              {req.quantity && <span> - Quantity: {req.quantity}</span>} <br />
              Location: {req.location} <br />
              Expiry: {new Date(req.expiry).toLocaleString()} <br />
              Donation Status: {req.donationStatus} <br />
              Request Status: {req.status}
              {req.photo && (
                <div>
                  <img
                    src={`http://localhost:3001/uploads/${req.photo}`}
                    alt={req.foodName}
                    style={{ width: "150px", marginTop: "10px" }}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
