import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function PickupRequests() {
  const { token } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          "http://localhost:3001/api/volunteer/unassigned-requests",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Check content type
        const contentType = res.headers.get("content-type");
        let data;
        if (contentType && contentType.includes("application/json")) {
          data = await res.json();
        } else {
          const text = await res.text();
          throw new Error(`Invalid response from server: ${text}`);
        }

        if (!res.ok) throw new Error(data.message || "Failed to fetch pickup requests.");

        setRequests(data.requests || []);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [token]);

  const handleAccept = async (requestId) => {
  try {
    const res = await fetch(
      `http://localhost:3001/api/volunteer/accept-request/${requestId}`, // ✅ correct URL
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Failed to accept request.");
    alert(data.message);

    // Remove accepted request from list
    setRequests((prev) => prev.filter((r) => r.requestId !== requestId));
  } catch (err) {
    alert(err.message);
  }
};

  if (loading) return <p>Loading pickup requests...</p>;
  if (error) return <p className="error">Failed to fetch pickup requests: {error}</p>;
  if (requests.length === 0)
    return <p>No available pickup requests at the moment. Check back later!</p>;

  return (
    <div className="pickup-requests-container">
      <h2>Available Pickup Requests</h2>
      <ul>
        {requests.map((req) => (
          <li key={req.requestId} className="pickup-request-item">
            <p>
              <strong>Food:</strong> {req.foodName} ({req.quantity})
            </p>
            <p>
              <strong>Donor:</strong> {req.donorName}, {req.donorAddress}
            </p>
            <p>
              <strong>Expiry:</strong> {new Date(req.expiry).toLocaleString()}
            </p>
            <button onClick={() => handleAccept(req.requestId)}>Accept Request</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
