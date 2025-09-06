import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import "./ProfilePage.css";
import defaultProfileIcon from "../assets/profile-icon.png"; // Adjust path if needed

const ProfilePage = () => {
  const { token, setAuthToken } = useAuth();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);

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

          let flattened = { ...data };

          if (data.role === "volunteer" && data.volunteerDetails) {
            flattened = { ...flattened, ...data.volunteerDetails };
          } else if (data.role === "donor" && data.donorDetails) {
            flattened = { ...flattened, ...data.donorDetails };
          } else if (data.role === "ngo" && data.ngoDetails) {
            flattened = { ...flattened, ...data.ngoDetails };
          }

          setUser(flattened);

          // Load image from backend if available
 if (flattened.profile_photo) {
  setSelectedImage(`http://localhost:3001/${flattened.profile_photo}`);
}
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file));
      setUser({ ...user, profileImageFile: file });
    }
  };

  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSaveClick = async () => {
    try {
      const formData = new FormData();

      // Basic fields
      ["name", "phone", "address", "city", "pincode"].forEach((key) => {
        if (user[key]) formData.append(key, user[key]);
      });

      // Role-specific fields
      if (user.role === "volunteer") {
        if (user.preferredArea) formData.append("preferredArea", user.preferredArea);
        if (user.vehicleType) formData.append("vehicleType", user.vehicleType);
        if (user.availability) formData.append("availability", user.availability);
      } else if (user.role === "donor") {
        if (user.donorType) formData.append("donorType", user.donorType);
        if (user.foodType) formData.append("foodType", user.foodType);
        if (user.availabilityTime) formData.append("availabilityTime", user.availabilityTime);
      } else if (user.role === "ngo") {
        if (user.ngoName) formData.append("ngoName", user.ngoName);
        if (user.licenseNumber) formData.append("licenseNumber", user.licenseNumber);
        if (user.capacity) formData.append("capacity", user.capacity);
        if (user.ngoFoodType) formData.append("ngoFoodType", user.ngoFoodType);
      }

      if (user.profileImageFile) {
        formData.append("profileImage", user.profileImageFile);
      }

      const res = await fetch("http://localhost:3001/api/user/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        alert("Profile updated successfully");
        setIsEditing(false);
      } else {
        alert("Failed to update profile");
      }
    } catch (err) {
      console.error("Update error:", err);
      alert("An error occurred while updating the profile");
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    window.location.href = "/login";
  };

  if (!user) return <p>Loading profile...</p>;

  return (
    <div className="profile-container">
      <div className="profile-picture-wrapper">
        <img
          src={selectedImage || defaultProfileIcon}
          alt="Profile"
          className="avatar"
        />
        {isEditing && (
          <>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageChange}
              style={{ display: "none" }}
            />
            <button
              className="edit-image-btn"
              onClick={handleImageClick}
              aria-label="Change profile picture"
              title="Change Profile Picture"
              type="button"
            >
              ✏️
            </button>
          </>
        )}
      </div>

      <h2>My Profile</h2>

      <div className="profile-details">
        {[
          { label: "Name", key: "name" },
          { label: "Email", key: "email", disabled: true },
          { label: "Phone", key: "phone" },
          { label: "Address", key: "address" },
          { label: "City", key: "city" },
          { label: "Pincode", key: "pincode" },
        ].map(({ label, key, disabled }) => (
          <div className="profile-row" key={key}>
            <label>{label}:</label>
            <input
              type={key === "email" ? "email" : "text"}
              value={user[key] || ""}
              disabled={!isEditing || disabled}
              onChange={(e) => setUser({ ...user, [key]: e.target.value })}
            />
          </div>
        ))}

        {/* Role-specific fields */}
        {user.role === "volunteer" && (
          <>
            {[
              { label: "Preferred Area", key: "preferredArea" },
              { label: "Vehicle Type", key: "vehicleType" },
              { label: "Availability", key: "availability" },
            ].map(({ label, key }) => (
              <div className="profile-row" key={key}>
                <label>{label}:</label>
                <input
                  type="text"
                  value={user[key] || ""}
                  disabled={!isEditing}
                  onChange={(e) => setUser({ ...user, [key]: e.target.value })}
                />
              </div>
            ))}
          </>
        )}

        {user.role === "donor" && (
          <>
            {[
              { label: "Donor Type", key: "donorType" },
              { label: "Food Type", key: "foodType" },
              { label: "Availability Time", key: "availabilityTime" },
            ].map(({ label, key }) => (
              <div className="profile-row" key={key}>
                <label>{label}:</label>
                <input
                  type="text"
                  value={user[key] || ""}
                  disabled={!isEditing}
                  onChange={(e) => setUser({ ...user, [key]: e.target.value })}
                />
              </div>
            ))}
          </>
        )}

        {user.role === "ngo" && (
          <>
            {[
              { label: "NGO Name", key: "ngoName" },
              { label: "License Number", key: "licenseNumber" },
              { label: "Capacity", key: "capacity" },
              { label: "NGO Food Type", key: "ngoFoodType" },
            ].map(({ label, key }) => (
              <div className="profile-row" key={key}>
                <label>{label}:</label>
                <input
                  type="text"
                  value={user[key] || ""}
                  disabled={!isEditing}
                  onChange={(e) => setUser({ ...user, [key]: e.target.value })}
                />
              </div>
            ))}
          </>
        )}
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
