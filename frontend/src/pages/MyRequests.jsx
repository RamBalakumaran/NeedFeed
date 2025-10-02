import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./MyRequests.css";

export default function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setLoading(false);
      navigate("/login"); // redirect if not logged in
      return;
    }

    const fetchRequests = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/feed/my-requests", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          navigate("/login");
          return;
        }

        if (res.status === 403) {
          throw new Error("You are not registered as an NGO.");
        }

        if (!res.ok) {
          throw new Error(`Failed to fetch requests. Status: ${res.status}`);
        }

        const data = await res.json();
        setRequests(data);
      } catch (err) {
        console.error("Error fetching requests:", err);
        setError(err.message || "Could not load your requests.");
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [token, navigate]);

  // Navigate to request details
  const handleClaim = async (requestId, requestStatus) => {
  if (requestStatus !== "Approved") {
    alert(`You can only claim this request after donor approval.`);
    return;
  }

  // Call backend to confirm claim immediately
  try {
    const res = await fetch(`http://localhost:3001/api/feed/book-request/${requestId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ needVolunteer: false }), // or pass selected volunteer
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Claim failed");

    // Update local state to show 'Ordered' → then button changes to 'Mark as Received'
    setRequests((prev) =>
      prev.map((req) =>
        req.requestId === requestId
          ? { ...req, requestStatus: "Ordered", deliveryStatus: "PendingPickup" }
          : req
      )
    );

    // Optionally navigate to request details
    navigate(`/request-details/${requestId}`);
  } catch (err) {
    alert("Claim failed: " + err.message);
  }
};

  return (
    <div className="my-requests-container">
      <h2>My Food Requests</h2>

      {error && <p className="error-message">{error}</p>}

      {!loading && requests.length === 0 && !error ? (
        <p>You have not made any food requests yet.</p>
      ) : (
        <ul className="request-list">
          {requests.map((req) => (
            <li key={req.requestId} className="request-card">
              {req.photo && (
                <img
                  src={`http://localhost:3001/uploads/${req.photo}`}
                  alt={req.foodName}
                  className="request-photo"
                />
              )}
              <h3>{req.foodName}</h3>
              <p><strong>Quantity:</strong> {req.quantity || "N/A"}</p>
              <p><strong>Location:</strong> {req.location || "N/A"}</p>
              <p><strong>Expiry:</strong> {req.expiry ? new Date(req.expiry).toLocaleDateString() : "N/A"}</p>

              <p>
                <strong>Donation Status:</strong>{" "}
                <span className={`status ${req.donationStatus?.toLowerCase() || "pending"}`}>
                  {req.donationStatus || "Pending"}
                </span>
              </p>

              <p>
                <strong>Request Status:</strong>{" "}
                <span className={`status ${req.requestStatus?.toLowerCase() || "pending"}`}>
                  {req.requestStatus || "Pending"}
                </span>
              </p>

              <p>
                <strong>Donor:</strong> {req.donorName || "N/A"} ({req.donorEmail || "N/A"})
              </p>

              <button
                className={`status-button ${req.requestStatus === "Approved" ? "approved" : "pending"}`}
                onClick={() => handleClaim(req.requestId, req.requestStatus)}
                disabled={req.requestStatus !== "Approved"}
              >
                {req.requestStatus === "Approved" ? "Claim Food" : `Cannot Claim (${req.requestStatus || "N/A"})`}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
