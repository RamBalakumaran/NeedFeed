import React from 'react';
import { Link } from 'react-router-dom';
import './AboutUsPage.css'; 

const ServicePage = () => {
  return (
    <div className="static-page-container">
      <div className="static-page-content">
        <h1>Our Service</h1>
        <p className="mission-statement">
          A simple, effective, and free platform for connecting food donors with those in need.
        </p>

        <h2>For Donors</h2>
        <p>
          Have leftover food from a party, restaurant, or event? Don't let it go to waste. Our platform allows you to post a donation in under a minute. Simply describe the food, set a pickup location, and we'll handle alerting local volunteers and organizations.
        </p>

        <h2>For Receivers & NGOs</h2>
        <p>
          Get access to a real-time feed of available food donations in your area. Our system is designed to be simple and mobile-friendly, allowing you to quickly find and claim food donations to support your community.
        </p>

        <h2>For Volunteers</h2>
        <p>
          Become a hero in your community. As a volunteer, you are the crucial link in our chain. You'll get notifications for nearby food pickups and can help transport donations from donors to distribution points, directly impacting lives.
        </p>

        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <Link to="/register" className="home-button primary" style={{ fontSize: '1.2rem', padding: '15px 30px' }}>Get Started</Link>
        </div>
      </div>
    </div>
  );
};

export default ServicePage;