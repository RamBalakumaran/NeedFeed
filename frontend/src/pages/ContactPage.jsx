import React, { useState } from 'react';
import './ContactPage.css'; // We will create this CSS file next

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [statusMessage, setStatusMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real application, you would connect this to a backend service (like Nodemailer)
    // or a third-party email service (like EmailJS) to actually send the email.
    // For this example, we'll just simulate a success message.
    console.log("Form data submitted:", formData);
    setStatusMessage("Thank you for your message! We'll get back to you soon.");
    setFormData({ name: '', email: '', message: '' }); // Clear the form
  };

  return (
    <div className="contact-page-wrapper">
      <div className="contact-page-container">
        <div className="contact-header">
          <h1>Get In Touch</h1>
          <p>We'd love to hear from you. Whether you have a question, feedback, or want to partner with us, drop us a line!</p>
        </div>
        
        <div className="contact-body">
          {/* Left Side: Contact Form */}
          <div className="contact-form">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="message">Message</label>
                <textarea id="message" name="message" rows="6" value={formData.message} onChange={handleChange} required></textarea>
              </div>
              <button type="submit" className="submit-button">Send Message</button>
            </form>
            {statusMessage && <p className="status-message">{statusMessage}</p>}
          </div>

          {/* Right Side: Contact Info */}
          <div className="contact-info">
            <h3>Contact Information</h3>
            <p>Reach out to us directly through the channels below.</p>
            <div className="info-item">
              <strong>Email:</strong>
              <p>contact@needfeed.com</p>
            </div>
            <div className="info-item">
              <strong>Phone:</strong>
              <p>+1 (234) 567-890</p>
            </div>
            <div className="info-item">
              <strong>Address:</strong>
              <p>123 Charity Lane, Community City, 10101</p>
            </div>
            <div className="info-item">
              <strong>Follow Us:</strong>
              <div className="social-links">
                <a href="#">Facebook</a> | <a href="#">Twitter</a> | <a href="#">Instagram</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;