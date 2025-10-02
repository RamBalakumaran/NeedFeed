import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function PickupRequests() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [acceptingId, setAcceptingId] = useState(null);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:3001/api/feed/unassigned-requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch pickup requests");
      const data = await res.json();
      setRequests(data.requests);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const acceptRequest = async (requestId) => {
    setAcceptingId(requestId);
    setMessage("");
    setError("");
    try {
      const res = await fetch(`http://localhost:3001/api/volunteer/accept-request/${requestId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to accept request");
      
      setMessage(data.message);
      // Remove the accepted request from the list
      setRequests((prevRequests) => prevRequests.filter((r) => r.requestId !== requestId));

      // Optional: Redirect to My Deliveries page after a short delay
      setTimeout(() => {
          navigate('/my-deliveries');
      }, 2000);

    } catch (e) {
      setError(e.message);
    } finally {
      setAcceptingId(null);
    }
  };

  if (loading) return <p>Loading available pickup requests...</p>;

  return (
    <div style={styles.container}>
      <h2>Available Pickup Requests</h2>
      <p>These are unassigned requests that need a volunteer. Accept a request to add it to your deliveries.</p>

      {error && <p style={styles.error}>{error}</p>}
      {message && <p style={styles.message}>{message}</p>}

      {requests.length === 0 && !loading ? (
        <p>No available pickup requests at the moment. Check back later!</p>
      ) : (
        <ul style={styles.list}>
          {requests.map((r) => (
            <li key={r.requestId} style={styles.listItem}>
              <h4>{r.foodName} ({r.quantity})</h4>
              <p><strong>From Donor:</strong> {r.donorName}</p>
              <p><strong>At Location:</strong> {r.donorAddress}</p>
              <p><small>Expires: {new Date(r.expiry).toLocaleDateString()}</small></p>
              <button
                style={styles.button}
                disabled={acceptingId === r.requestId}
                onClick={() => acceptRequest(r.requestId)}
              >
                {acceptingId === r.requestId ? "Accepting..." : "Accept Request"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const styles = {
    container: { maxWidth: '800px', margin: '2rem auto', padding: '1rem' },
    list: { listStyle: 'none', padding: 0 },
    listItem: { border: '1px solid #ccc', marginBottom: 12, padding: 16, borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
    button: { padding: '10px 15px', cursor: 'pointer', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', fontSize: '1rem' },
    error: { color: 'red', backgroundColor: '#ffebee', padding: '10px', borderRadius: '5px' },
    message: { color: 'green', backgroundColor: '#e8f5e9', padding: '10px', borderRadius: '5px' }
};