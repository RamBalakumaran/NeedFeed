// frontend/src/pages/HomePage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css'; // We will create new styles for this one-page layout

// --- Section 1: Hero Welcome Area ---
const HeroSection = () => (
  <div className="hero-section">
    <div className="hero-content">
      <h1>Welcome to NeedFeed</h1>
      <p>Connecting surplus food with those in need. Reduce waste, feed the hungry.</p>
      <div className="hero-actions">
        <Link to="/login" className="hero-button primary">Login to Continue</Link>
        <Link to="/register" className="hero-button secondary">Join Our Mission</Link>
      </div>
    </div>
  </div>
);

// --- Section 2: Service Section ---
const ServiceSection = () => (
  <section id="service" className="page-section">
    <h1>Our Service</h1>
    <p className="section-intro">A simple, effective, and free platform for connecting food donors with those in need.</p>
    <div className="service-grid">
      <div className="service-card">
        <h3>For Donors</h3>
        <p>Have leftover food from a party, restaurant, or event? Our platform allows you to post a donation in under a minute. We'll handle alerting local volunteers.</p>
      </div>
      <div className="service-card">
        <h3>For Receivers & NGOs</h3>
        <p>Get access to a real-time feed of available food donations in your area, allowing you to quickly find and claim food to support your community.</p>
      </div>
      <div className="service-card">
        <h3>For Volunteers</h3>
        <p>Become a hero in your community. As a volunteer, you are the crucial link, transporting donations from donors to distribution points.</p>
      </div>
    </div>
  </section>
);

// --- Section 3: About Us Section ---
const AboutUsSection = () => (
  <section id="about-us" className="page-section">
    <h1>About NeedFeed</h1>
    <p className="section-intro">Our mission is to bridge the gap between food surplus and food scarcity through a seamless, community-driven platform.</p>
    <div className="about-content">
      <p>Every day, tons of perfectly edible food is thrown away while millions struggle with hunger. NeedFeed was born from a simple idea: what if we could connect that surplus food directly with the people who need it most? Our platform allows individuals and businesses to easily donate excess food, which is then picked up by volunteers and delivered to local charities and those in need.</p>
    </div>
  </section>
);

// --- Section 4: Contact Us Section ---
const ContactSection = () => (
    <section id="contact-us" className="page-section">
        <h1>Contact Us</h1>
        <p className="section-intro">Have questions or want to partner with us? We'd love to hear from you.</p>
        <form className="contact-form-simple">
            <input type="text" placeholder="Your Name" required />
            <input type="email" placeholder="Your Email" required />
            <textarea placeholder="Your Message" rows="5" required></textarea>
            <button type="submit">Send Message</button>
        </form>
    </section>
);


// --- Main HomePage Component that assembles all sections ---
const HomePage = () => {
  return (
    <>
      <HeroSection />
      <ServiceSection />
      <AboutUsSection />
      <ContactSection />
    </>
  );
};

export default HomePage;