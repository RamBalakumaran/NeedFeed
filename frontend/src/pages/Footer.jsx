// frontend/src/components/Footer.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Footer.css'; // We will create this CSS file next

const Footer = () => {
    const navigate = useNavigate();

    // Re-using the same scroll logic from the Navbar for consistency
    const handleScroll = (e, targetId) => {
        e.preventDefault();
        if (window.location.pathname !== '/') {
            navigate('/');
            setTimeout(() => {
                document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } else {
            document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <footer className="site-footer">
            <div className="footer-content">
                <div className="footer-about">
                    <h3>NeedFeed</h3>
                    <p>Connecting surplus food with those in need. Join us in our mission to reduce waste and fight hunger in our community.</p>
                </div>
                <div className="footer-links">
                    <h3>Quick Links</h3>
                    <ul>
                        <li><a href="#service" onClick={(e) => handleScroll(e, 'service')}>Our Service</a></li>
                        <li><a href="#about-us" onClick={(e) => handleScroll(e, 'about-us')}>About Us</a></li>
                        <li><a href="#contact-us" onClick={(e) => handleScroll(e, 'contact-us')}>Contact</a></li>
                        <li><Link to="/login">Login</Link></li>
                    </ul>
                </div>
                <div className="footer-contact">
                    <h3>Contact Us</h3>
                    <p>contact@needfeed.com</p>
                    <p>+1 (234) 567-890</p>
                    <div className="social-media">
                        <a href="#">Facebook</a>
                        <a href="#">Twitter</a>
                        <a href="#">Instagram</a>
                    </div>
                </div>
            </div>
            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} NeedFeed. All Rights Reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;