import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // adjust path if needed

const Navigation = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const handleScroll = (e, targetId) => {
    e.preventDefault();

    if (window.location.pathname !== "/home") {
      navigate("/home");
      setTimeout(() => {
        document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="main-nav">
      <div className="nav-left">
        <Link to={token ? "/available" : "/home"} className="nav-brand">
          NeedFeed
        </Link>
      </div>
      <div className="nav-right">
        {token ? (
          <>
            <Link to="/donate" className="nav-link">Donate Food</Link>
            <Link to="/available" className="nav-link">Available Food</Link>
            <Link to="/profile" className="nav-link">Profile</Link>
          </>
        ) : (
          <>
            <Link to="/home" className="nav-link">Home</Link>
            <a
              href="#how-it-works"
              className="nav-link"
              onClick={(e) => handleScroll(e, "how-it-works")}
            >
              How It Works
            </a>
            <a
              href="#about"
              className="nav-link"
              onClick={(e) => handleScroll(e, "about")}
            >
              About Us
            </a>
            <a
              href="#contact-us"
              className="nav-link"
              onClick={(e) => handleScroll(e, "contact-us")}
            >
              Contact Us
            </a>
            <Link to="/login" className="nav-link">Login</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
