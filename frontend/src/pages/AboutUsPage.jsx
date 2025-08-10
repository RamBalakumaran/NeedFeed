// frontend/src/pages/AboutUsPage.jsx
import React from 'react';
import './AboutUsPage.css';

const AboutUsPage = () => {
  return (
    <div className="static-page-container">
      <div className="static-page-content">
        <h1>About NeedFeed</h1>
        <p className="mission-statement">
          Our mission is to bridge the gap between food surplus and food scarcity by creating a seamless, community-driven platform for food redistribution.
        </p>
        
        <h2>The Problem We Solve</h2>
        <p>
          Every day, tons of perfectly edible food from restaurants, events, and homes is thrown away. At the same time, millions of people struggle with hunger. NeedFeed was born from a simple idea: what if we could connect that surplus food directly with the people who need it most?
        </p>

        <h2>How It Works</h2>
        <ol>
          <li><strong>Donate:</strong> Individuals and businesses with excess food can quickly post what's available through our simple donation form.</li>
          <li><strong>Connect:</strong> Our platform instantly notifies local volunteers and charitable organizations about new donations.</li>
          <li><strong>Distribute:</strong> Volunteers pick up the food and deliver it to local shelters, community centers, or individuals in need, ensuring it gets to them while it's still fresh.</li>
        </ol>

        <h2>Join Our Community</h2>
        <p>
          Whether you're a donor with extra food, a volunteer with time to give, or an organization on the front lines of fighting hunger, you can be a part of the solution. Together, we can reduce waste and build a stronger, more resilient community.
        </p>
      </div>
    </div>
  );
};

export default AboutUsPage;