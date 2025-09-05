import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import "./ProfilePage.css";

const ProfilePage = () => {
  const { token, setAuthToken } = useAuth();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch user details from backend
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/user/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          console.error("Failed to fetch profile");
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };

    if (token) fetchProfile();
  }, [token]);

  const handleUpdateClick = () => {
    setIsEditing(true);
  };

  const handleSaveClick = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(user),
      });

      if (res.ok) {
        setIsEditing(false);
        alert("Profile updated successfully ✅");
      } else {
        alert("Failed to update profile ❌");
      }
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    window.location.href = "/login";
  };

  if (!user) {
    return <p>Loading profile...</p>;
  }

  return (
    <div className="profile-container">
      <h2>My Profile</h2>

      <div className="profile-details">
        <div className="profile-row">
          <label>Name:</label>
          <input
            type="text"
            value={user.name || ""}
            disabled={!isEditing}
            onChange={(e) => setUser({ ...user, name: e.target.value })}
          />
        </div>

        <div className="profile-row">
          <label>Email:</label>
          <input type="email" value={user.email || ""} disabled />
        </div>

        <div className="profile-row">
          <label>Phone:</label>
          <input
            type="text"
            value={user.phone || ""}
            disabled={!isEditing}
            onChange={(e) => setUser({ ...user, phone: e.target.value })}
          />
        </div>

        <div className="profile-row">
          <label>Address:</label>
          <input
            type="text"
            value={user.address || ""}
            disabled={!isEditing}
            onChange={(e) => setUser({ ...user, address: e.target.value })}
          />
        </div>

        <div className="profile-row">
          <label>Preferred Area:</label>
          <input
            type="text"
            value={user.preferredArea || ""}
            disabled={!isEditing}
            onChange={(e) => setUser({ ...user, preferredArea: e.target.value })}
          />
        </div>

        <div className="profile-row">
          <label>Vehicle Type:</label>
          <input
            type="text"
            value={user.vehicleType || ""}
            disabled={!isEditing}
            onChange={(e) => setUser({ ...user, vehicleType: e.target.value })}
          />
        </div>

        <div className="profile-row">
          <label>Availability:</label>
          <input
            type="text"
            value={user.availability || ""}
            disabled={!isEditing}
            onChange={(e) => setUser({ ...user, availability: e.target.value })}
          />
        </div>
      </div>

      <div className="profile-actions">
        {isEditing ? (
          <button onClick={handleSaveClick} className="btn save-btn">
            Save Changes
          </button>
        ) : (
          <button onClick={handleUpdateClick} className="btn edit-btn">
            Update Profile
          </button>
        )}
        <button onClick={handleLogout} className="btn logout-btn">
          Logout
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
