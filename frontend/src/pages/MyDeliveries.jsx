import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";

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
      await fetchDeliveries(); // Refresh the list
    } catch (e) {
      setError(`Failed to update delivery ${deliveryId}: ${e.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <p>Loading your deliveries...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  const activeDeliveries = deliveries.filter((d) => d.status !== "Delivered");
  const deliveryHistory = deliveries.filter((d) => d.status === "Delivered");

  return (
    <div style={styles.container}>
      <h2>My Active Deliveries</h2>
      {activeDeliveries.length === 0 ? (
        <p>You have no active deliveries assigned.</p>
      ) : (
        <ul style={styles.list}>
          {activeDeliveries.map((d) => (
            <li key={d.deliveryId} style={styles.listItem}>
              <p><strong>Food:</strong> {d.foodName} ({d.quantity})</p>
              <p><strong>Status:</strong> <span style={styles.status}>{d.status}</span></p>
              <div style={styles.addressBlock}>
                <p><strong>PICKUP FROM (Donor):</strong><br />{d.donorName}<br />{d.donorAddress}</p>
                <p><strong>DELIVER TO (NGO):</strong><br />{d.ngoName}<br />{d.ngoAddress}</p>
              </div>
              {d.status === 'Assigned' && (
                <button style={styles.button} onClick={() => handleUpdateStatus(d.deliveryId, 'Picked Up')} disabled={updatingId === d.deliveryId}>
                  {updatingId === d.deliveryId ? "..." : "Mark as Picked Up"}
                </button>
              )}
              {d.status === 'Picked Up' && (
                <button style={styles.button} onClick={() => handleUpdateStatus(d.deliveryId, 'Delivered')} disabled={updatingId === d.deliveryId}>
                  {updatingId === d.deliveryId ? "..." : "Mark as Delivered"}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <h2 style={{ marginTop: '2rem' }}>Delivery History</h2>
      {deliveryHistory.length === 0 ? (
        <p>You have no completed deliveries.</p>
      ) : (
        <ul style={styles.list}>
          {deliveryHistory.map((d) => (
            <li key={d.deliveryId} style={{ ...styles.listItem, backgroundColor: '#f0f0f0', opacity: 0.8 }}>
              <p><strong>Food:</strong> {d.foodName} ({d.quantity})</p>
              <p><strong>Status:</strong> <span style={{ ...styles.status, color: 'green' }}>{d.status}</span></p>
              <p><small>Delivered from {d.donorName} to {d.ngoName}</small></p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Add some styles for better presentation
const styles = {
    container: { maxWidth: '800px', margin: '2rem auto', padding: '1rem' },
    list: { listStyle: 'none', padding: 0 },
    listItem: { border: '1px solid #ccc', marginBottom: 12, padding: 16, borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
    addressBlock: { display: 'flex', justifyContent: 'space-between', gap: '1rem', backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '5px', margin: '10px 0' },
    status: { fontWeight: 'bold', color: '#e67e22', padding: '3px 8px', borderRadius: '12px', backgroundColor: '#fdf3e6' },
    button: { padding: '8px 12px', marginTop: '10px', cursor: 'pointer', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '5px', fontSize: '0.9rem' }
};