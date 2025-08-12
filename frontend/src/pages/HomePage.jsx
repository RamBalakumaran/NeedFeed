// frontend/src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import './HomePage.css';
import aboutImage from '../assets/about-image.jpg';

// Import the SVG icons
import DonateIcon from '../assets/icons/donate-icon.svg';
import NotifyIcon from '../assets/icons/notify-icon.svg';
import DistributeIcon from '../assets/icons/distribute-icon.svg';

// --- Reusable AnimatedSection Component ---
const AnimatedSection = ({ children, className = '', id = '' }) => {
    const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
    return (
        <div ref={ref} id={id} className={`${className} fade-in-section ${inView ? 'is-visible' : ''}`}>
            {children}
        </div>
    );
};

// --- Reusable CountUp Component ---
const CountUp = ({ end, duration = 2000 }) => {
    // ... (This component's code remains the same as the previous "attractive" version)
    const [count, setCount] = useState(0);
    useEffect(() => {
        let start = 0;
        const endValue = parseInt(end, 10);
        if (start === endValue) return;
        const incrementTime = (duration / endValue) * 1;
        const timer = setInterval(() => {
        start += 1;
        setCount(start);
        if (start === endValue) clearInterval(timer);
        }, incrementTime);
        return () => clearInterval(timer);
    }, [end, duration]);
    return <span>{count}</span>;
};


// --- HeroSection Component ---
const HeroSection = () => {
    // ... (This component's code remains the same as the previous "attractive" version)
    const [text, setText] = useState('');
    const toRotate = ["Reduce Waste.", "Feed the Hungry.", "Build Community."];
    const [loopNum, setLoopNum] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    useEffect(() => {
        let ticker = setInterval(() => { tick(); }, isDeleting ? 100 : 200);
        return () => clearInterval(ticker);
    });
    const tick = () => {
        let i = loopNum % toRotate.length;
        let fullText = toRotate[i];
        let updatedText = isDeleting ? fullText.substring(0, text.length - 1) : fullText.substring(0, text.length + 1);
        setText(updatedText);
        if (!isDeleting && updatedText === fullText) { setIsDeleting(true); } 
        else if (isDeleting && updatedText === '') { setIsDeleting(false); setLoopNum(loopNum + 1); }
    };
    return (
        <div className="hero-section">
            <div className="hero-content">
                <h1>Welcome to NeedFeed</h1>
                <p className="animated-tagline">Connecting surplus food with those in need. <span className="txt-rotate">{text}</span><span className="cursor">|</span></p>
                <div className="hero-actions">
                    <Link to="/login" className="hero-button primary">Login to Continue</Link>
                    <Link to="/register" className="hero-button secondary">Join Our Mission</Link>
                </div>
            </div>
        </div>
    );
};

// --- HowItWorksSection Component ---
const HowItWorksSection = () => (
    <AnimatedSection className="page-section" id="how-it-works">
        <h1 className="section-title">How It Works</h1>
        <div className="steps-grid">
            <div className="step-card"><img src={DonateIcon} alt="Donate" className="step-icon" /><h3>1. Post a Donation</h3><p>Donors with excess food quickly post details about what's available through our simple form.</p></div>
            <div className="step-card"><img src={NotifyIcon} alt="Notify" className="step-icon" /><h3>2. Get Notified</h3><p>Volunteers and NGOs in the area receive instant notifications about new donations near them.</p></div>
            <div className="step-card"><img src={DistributeIcon} alt="Distribute" className="step-icon" /><h3>3. Distribute Food</h3><p>A volunteer picks up the food and delivers it to a local charity or individual in need.</p></div>
        </div>
    </AnimatedSection>
);

// --- AboutSection Component ---
const AboutSection = () => (
    <AnimatedSection className="page-section about-section-bg" id="about">
        <div className="about-container">
            <div className="about-image"><img src={aboutImage} alt="Community sharing food" /></div>
            <div className="about-text">
                <h2>Our Mission is Simple</h2>
                <p>We believe no good food should go to waste when people are hungry. NeedFeed is a technology-powered bridge connecting food surplus with food scarcity, creating a more sustainable and compassionate community, one meal at a time.</p>
                <div className="impact-stats">
                    <div className="stat-item"><h3><CountUp end={1200} />+</h3><p>Meals Served</p></div>
                    <div className="stat-item"><h3><CountUp end={350} />+</h3><p>Active Donors</p></div>
                    <div className="stat-item"><h3><CountUp end={50} />+</h3><p>Partner NGOs</p></div>
                </div>
            </div>
        </div>
    </AnimatedSection>
);

// --- TestimonialsSection Component ---
const TestimonialsSection = () => (
    <AnimatedSection className="page-section testimonials-section-bg">
        <h1 className="section-title">What Our Community Says</h1>
        <div className="testimonials-grid">
            <div className="testimonial-card"><p>"NeedFeed has transformed our ability to source last-minute donations. It's an essential tool for our shelter."</p><footer>- Sarah L., Community Shelter Director</footer></div>
            <div className="testimonial-card"><p>"As a restaurant owner, I used to hate seeing good food go to waste. Now, with a few clicks, I know it's going to a good cause."</p><footer>- Mike R., Restaurant Owner</footer></div>
            <div className="testimonial-card"><p>"Volunteering with NeedFeed is so rewarding. The app is easy to use, and you can see the direct impact you're making."</p><footer>- Jessica P., Volunteer</footer></div>
        </div>
    </AnimatedSection>
);


// --- NEW Contact Us Section ---
const ContactSection = () => (
    <AnimatedSection className="page-section" id="contact-us">
        <h1 className="section-title">Contact Us</h1>
        <p className="section-intro">Have questions or want to partner with us? We'd love to hear from you.</p>
        <form className="contact-form-simple">
            <input type="text" placeholder="Your Name" required />
            <input type="email" placeholder="Your Email" required />
            <textarea placeholder="Your Message" rows="5" required></textarea>
            <button type="submit">Send Message</button>
        </form>
    </AnimatedSection>
);


// --- Main HomePage Component that assembles all sections ---
const HomePage = () => {
  return (
    <>
      <HeroSection />
      <HowItWorksSection />
      <AboutSection />
      <TestimonialsSection />
      <ContactSection />
    </>
  );
};

export default HomePage;