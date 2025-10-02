import React from "react";
import { useNavigate } from "react-router-dom";
import "./ThankYou.css";

export default function ThankYou() {
  const navigate = useNavigate();
  return (
    <div className="thankyou-container">
      <h2>Thank You!</h2>
      <p>Your action has been recorded successfully.</p>
      <button onClick={() => navigate("/")}>Go Home</button>
    </div>
  );
}
