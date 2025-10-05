import React from "react";
import "./StatusTracker.css";

const stages = [
  "requested",
  "accepted",
  "volunteer_assigned",
  "picked_up",
  "out_for_delivery",
  "delivered",
  "received",
];

export default function StatusTracker({ currentStatus }) {
  const currentIndex = stages.indexOf(currentStatus);

  return (
    <div className="status-tracker">
      {stages.map((stage, i) => (
        <div
          key={stage}
          className={`stage ${i <= currentIndex ? "active" : ""}`}
        >
          <div className="circle">{i + 1}</div>
          <p>{stage.replace(/_/g, " ")}</p>
        </div>
      ))}
    </div>
  );
}
