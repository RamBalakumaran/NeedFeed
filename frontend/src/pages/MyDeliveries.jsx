import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import "./MyDeliveries.css";

export default function MyDeliveries() {
  const { token } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const fetchDeliveries = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:3001/api/volunteer/my-deliveries", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch deliveries");
      const data = await res.json();
      setDeliveries(data.deliveries);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  const handleUpdateStatus = async (deliveryId, newStatus) => {
    setUpdatingId(deliveryId);
    try {
      const res = await fetch(`http://localhost:3001/api/volunteer/delivery/${deliveryId}/update-status`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error(`Failed to mark as ${newStatus}`);
      await fetchDeliveries();
    } catch (e) {
      setError(`Failed to update delivery ${deliveryId}: ${e.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <p className="loading">Loading your deliveries...</p>;
  if (error) return <p className="error">{error}</p>;

  const activeDeliveries = deliveries.filter((d) => d.status !== "Delivered");
  const deliveryHistory = deliveries.filter((d) => d.status === "Delivered");

  return (
    <div className="deliveries-container">
      <h2>My Active Deliveries</h2>
      {activeDeliveries.length === 0 ? (
        <p>No active deliveries assigned.</p>
      ) : (
        <div className="deliveries-grid">
          {activeDeliveries.map((d) => (
            <div key={d.deliveryId} className="delivery-card">
              <p><strong>Food:</strong> {d.foodName} ({d.quantity})</p>
              <p>
                <strong>Status:</strong>{" "}
                <span className={`status-badge ${d.status === 'Delivered' ? 'delivered' : ''}`}>
                  {d.status}
                </span>
              </p>
              <div className="address-block">
                <div>
                  <strong>PICKUP FROM (Donor)</strong>
                  <p><strong>Name:</strong> {d.donorName}</p>
                  <p><strong>Address:</strong> {d.donorAddress}</p>
                </div>
                <div>
                  <strong>DELIVER TO (NGO)</strong>
                  <p><strong>Name:</strong> {d.ngoName}</p>
                  <p><strong>Address:</strong> {d.ngoAddress}</p>
                </div>
              </div>
              {d.status === 'Assigned' && (
                <button
                  className="deliver-btn"
                  onClick={() => handleUpdateStatus(d.deliveryId, 'PickedUp')}
                  disabled={updatingId === d.deliveryId}
                >
                  {updatingId === d.deliveryId ? "..." : "Mark as Picked Up"}
                </button>
              )}
              {d.status === 'PickedUp' && (
                <button
                  className="deliver-btn"
                  onClick={() => handleUpdateStatus(d.deliveryId, 'Delivered')}
                  disabled={updatingId === d.deliveryId}
                >
                  {updatingId === d.deliveryId ? "..." : "Mark as Delivered"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <h2>Delivery History</h2>
      {deliveryHistory.length === 0 ? (
        <p>No completed deliveries yet.</p>
      ) : (
        <div className="deliveries-grid">
          {deliveryHistory.map((d) => (
            <div key={d.deliveryId} className="delivery-card history-card">
              <p><strong>Food:</strong> {d.foodName} ({d.quantity})</p>
              <p>
                <strong>Status:</strong>{" "}
                <span className="status-badge delivered">{d.status}</span>
              </p>
              <p><small>Delivered from {d.donorName} to {d.ngoName}</small></p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
