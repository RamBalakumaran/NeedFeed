import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navigation = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const handleScroll = (e, targetId) => {
    e.preventDefault();
    if (window.location.pathname !== "/home") {
      navigate("/home");
      setTimeout(() => {
        document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth" });
      }, 200);
    } else {
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="main-nav">
      <div className="nav-left">
        <Link to={token ? "/home" : "/home"} className="nav-brand">
          NeedFeed
        </Link>
      </div>

      <div className="nav-right">
        {token ? (
          <>
            {user?.role === 'admin' && (
              <Link to="/admin" className="nav-link">Admin Panel</Link>
            )}
            {/* Donor Links */}
            {user?.role === "donor" && (
              <>
                <Link to="/donate" className="nav-link">Donate Food</Link>
                <Link to="/mydonations" className="nav-link">My Donations</Link>
                <Link to="/available" className="nav-link">Available Food</Link>
              </>
            )}

            {/* Needy / NGO Links */}
            {(user?.role === "needy" || user?.role === "ngo") && (
              <>
                <Link to="/requestfood" className="nav-link">Request Food</Link>
                <Link to="/myrequests" className="nav-link">My Requests</Link>
                <Link to="/available" className="nav-link">Available Food</Link>
              </>
            )}

            {/* Volunteer Links */}
            {user?.role === "volunteer" && (
              <>
                <Link to="/pickuprequests" className="nav-link">Pickup Requests</Link>
                <Link to="/mydeliveries" className="nav-link">My Deliveries</Link>
              </>
            )}

            {/* Common Link */}
            <Link to="/profile" className="nav-link">Profile</Link>
          </>
        ) : (
          <>
            <Link to="/home" className="nav-link">Home</Link>
            <a href="#how-it-works" className="nav-link" onClick={(e) => handleScroll(e, "how-it-works")}>How It Works</a>
            <a href="#about" className="nav-link" onClick={(e) => handleScroll(e, "about")}>About Us</a>
            <a href="#contact-us" className="nav-link" onClick={(e) => handleScroll(e, "contact-us")}>Contact Us</a>
            <Link to="/login" className="nav-link">Login</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
