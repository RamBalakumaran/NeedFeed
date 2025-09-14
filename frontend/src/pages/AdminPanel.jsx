import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AdminPanel.css";

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ role: "", city: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // New state to keep track of sorting
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });

  // Function to toggle sorting on column headers
  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        // If clicking same column, toggle asc/desc
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      // New sort column defaults to ascending
      return { key, direction: "asc" };
    });
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const params = {
        ...((filters.role || filters.city) && filters),
        // You can send sorting to backend here if supported:
        // sort: sortConfig.key,
        // order: sortConfig.direction,
      };

      const { data } = await axios.get("http://localhost:3001/api/user/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      let usersData = data.users || data;

      // Frontend sorting fallback:
      if (sortConfig.key) {
        usersData = [...usersData].sort((a, b) => {
          const aVal = a[sortConfig.key] ? a[sortConfig.key].toString().toLowerCase() : "";
          const bVal = b[sortConfig.key] ? b[sortConfig.key].toString().toLowerCase() : "";

          if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
          if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
          return 0;
        });
      }

      setUsers(usersData);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to fetch users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sortConfig]);

  // Helper to show sorting arrow on column headers
  const renderSortArrow = (columnKey) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === "asc" ? " ▲" : " ▼";
  };

  return (
    <div className="admin-panel-container">
      <h1>Admin Dashboard</h1>

      {/* Filters */}
      <div className="filters">
        <select
          value={filters.role}
          onChange={(e) => setFilters({ ...filters, role: e.target.value })}
        >
          <option value="">All Roles</option>
          <option value="donor">Donor</option>
          <option value="needy">Needy</option>
          <option value="ngo">NGO</option>
          <option value="volunteer">Volunteer</option>
          <option value="admin">Admin</option>
        </select>
        <input
          type="text"
          placeholder="Search by city..."
          value={filters.city}
          onChange={(e) => setFilters({ ...filters, city: e.target.value })}
        />
      </div>

      {/* User List */}
      <div className="table-container">
        {loading ? (
          <p className="loading">Loading users...</p>
        ) : error ? (
          <p className="error">{error}</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th onClick={() => handleSort("name")} style={{ cursor: "pointer" }}>
                  Name{renderSortArrow("name")}
                </th>
                <th onClick={() => handleSort("email")} style={{ cursor: "pointer" }}>
                  Email{renderSortArrow("email")}
                </th>
                <th onClick={() => handleSort("role")} style={{ cursor: "pointer" }}>
                  Role{renderSortArrow("role")}
                </th>
                <th onClick={() => handleSort("city")} style={{ cursor: "pointer" }}>
                  City{renderSortArrow("city")}
                </th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((u) => (
                  <tr key={u.id || u._id}>
                    <td>{u.name || "N/A"}</td>
                    <td>{u.email || "N/A"}</td>
                    <td>{u.role || "N/A"}</td>
                    <td>{u.city || "N/A"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="no-users">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
