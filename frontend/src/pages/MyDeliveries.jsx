import React, { useEffect, useState } from "react";
import "./MyDeliveries.css";

export default function MyDeliveries() {
  const [deliveries, setDeliveries] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch("http://localhost:5000/api/deliveries/my", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // ensure backend checks volunteer id
      },
    })
      .then((res) => res.json())
      .then((data) => setDeliveries(data))
      .catch((err) => console.error("Error fetching deliveries:", err));
  }, []);

  const handleMarkDelivered = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:5000/api/deliveries/${id}/complete`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      setDeliveries((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, status: "Delivered" } : d
        )
      );
    } catch (err) {
      console.error("Error marking delivery complete:", err);
    }
  };

  return (
    <div className="deliveries-container">
      <h2>My Deliveries</h2>
      {deliveries.length === 0 ? (
        <p>You have no active or past deliveries.</p>
      ) : (
        <div className="deliveries-grid">
          {deliveries.map((d) => (
            <div key={d.id} className="delivery-card">
              <h3>{d.foodName}</h3>
              <p><strong>Pickup Location:</strong> {d.pickupLocation}</p>
              <p><strong>Drop Location:</strong> {d.dropLocation}</p>
              <p><strong>Status:</strong> {d.status}</p>
              {d.status !== "Delivered" && (
                <button
                  className="deliver-btn"
                  onClick={() => handleMarkDelivered(d.id)}
                >
                  Mark as Delivered
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
