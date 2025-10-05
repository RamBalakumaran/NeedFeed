import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import StatusTracker from "./StatusTracker"; // ✅ Import visual tracker
import "./MyRequests.css";

export default function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { token } = useAuth();
  const navigate = useNavigate();

  // ✅ Fetch logged-in NGO's food requests
  useEffect(() => {
    if (!token) {
      navigate("/login");
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
          throw new Error(`Failed to fetch requests (Status: ${res.status})`);
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

  // ✅ NGO claims food only after donor approval
  const handleClaim = (requestId, requestStatus) => {
    if (requestStatus !== "Approved") {
      alert("You can only claim this request after donor approval.");
      return;
    }

    // Redirect to a detailed request page (volunteer assignment, etc.)
    navigate(`/request-details/${requestId}`);
  };

  // ✅ UI Rendering
  if (loading) {
    return (
      <div className="my-requests-container">
        <h2>Loading your requests...</h2>
      </div>
    );
  }

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
              {/* 🖼️ Food Image */}
              {req.photo && (
                <img
                  src={`http://localhost:3001/uploads/${req.photo}`}
                  alt={req.foodName}
                  className="request-photo"
                />
              )}

              {/* 🍱 Food Info */}
              <h3>{req.foodName}</h3>
              <p>
                <strong>Quantity:</strong> {req.quantity || "N/A"}
              </p>
              <p>
                <strong>Location:</strong> {req.location || "N/A"}
              </p>
              <p>
                <strong>Expiry:</strong>{" "}
                {req.expiry
                  ? new Date(req.expiry).toLocaleDateString()
                  : "N/A"}
              </p>

              {/* 🔁 Status Info */}
              <p>
                <strong>Donation Status:</strong>{" "}
                <span
                  className={`status ${req.donationStatus?.toLowerCase() || "pending"
                    }`}
                >
                  {req.donationStatus || "Pending"}
                </span>
              </p>

              <p>
                <strong>Request Status:</strong>{" "}
                <span
                  className={`status ${req.requestStatus?.toLowerCase() || "pending"
                    }`}
                >
                  {req.requestStatus || "Pending"}
                </span>
              </p>

              {/* 👤 Donor Info */}
              <p>
                <strong>Donor:</strong>{" "}
                {req.donorName || "N/A"} ({req.donorEmail || "N/A"})
              </p>

              {/* 📦 Visual Status Tracker */}
              {/* <StatusTracker
                currentStatus={req.donationStatus?.toLowerCase() || "requested"}
              /> */}

              {/* 🟢 Claim Button */}
              <button
                className={`status-button ${req.requestStatus === "Approved" ? "approved" : "pending"
                  }`}
                onClick={() =>
                  handleClaim(req.requestId, req.requestStatus)
                }
                disabled={req.requestStatus !== "Approved"}
              >
                {req.requestStatus === "Approved"
                  ? "Claim Food"
                  : `Cannot Claim (${req.requestStatus || "N/A"})`}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
