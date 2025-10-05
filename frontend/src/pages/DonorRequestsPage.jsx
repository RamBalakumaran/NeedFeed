import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import './DonorRequestsPage.css';

const DonorRequestsPage = () => {
  const { token } = useAuth();
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");

  const fetchRequests = async () => {
    try {
      const res = await axios.get("http://localhost:3001/api/feed/donor-requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.data);
    } catch (err) {
      setError("Could not fetch requests.");
    }
  };

  const handleUpdate = async (id, status) => {
    try {
      // Status must be "Approved" or "Rejected"
      await axios.put(
        `http://localhost:3001/api/feed/donor/request/${id}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchRequests(); // refresh list
    } catch (err) {
      alert(err.response?.data?.message || "Error updating request");
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <div className="donor-requests-page">
      <h1>Requests for Your Donations</h1>
      {error && <p className="error-text">{error}</p>}

      {requests.length > 0 ? (
        <div className="food-grid">
          {requests.map((req) => (
            <div key={req.requestId} className="food-card">
              <h3>{req.foodName}</h3>
              {req.photo && (
                <img
                  src={`http://localhost:3001/uploads/${req.photo}`}
                  alt={req.foodName}
                  className="food-image"
                />
              )}
              <p><strong>NGO:</strong> {req.ngo_name} ({req.ngo_email})</p>
              <p><strong>Quantity:</strong> {req.quantity}</p>
              <p><strong>Location:</strong> {req.location}</p>
              <p><strong>Status:</strong> {req.status}</p>
              <p><strong>Requested At:</strong> {new Date(req.createdAt).toLocaleString()}</p>

              {req.status === "Pending" && (
                <div className="button-group">
                  <button
                    className="approve-btn"
                    onClick={() => handleUpdate(req.requestId, "Approved")}
                  >
                    Approve
                  </button>
                  <button
                    className="reject-btn"
                    onClick={() => handleUpdate(req.requestId, "Rejected")}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="no-requests">No requests yet.</p>
      )}
    </div>
  );
};

export default DonorRequestsPage;
