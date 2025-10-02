import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DonationPage from "./pages/DonationPage";
import AvailableFoodPage from "./pages/AvailableFoodPage";
import RequestFood from "./pages/RequestFoodPage";
import MyRequests from "./pages/MyRequests";
import Donations from "./pages/MyDonations";
import PickupRequests from "./pages/PickupRequests";
import MyDeliveries from "./pages/MyDeliveries";
import ProfilePage from "./pages/ProfilePage";
import Footer from "./pages/Footer";
import Navigation from "./components/Navigation";
import AdminPanel from './pages/AdminPanel';
import DonorRequestsPage from "./pages/DonorRequestsPage";
import RequestDetails from "./pages/RequestDetails";

// --- Role-based Protected Wrapper ---
const RoleRoute = ({ allowedRoles, children }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/home" replace />;

  return children;
};

// --- Main App Component ---
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Navigation />
          <main className="main-content">
            <Routes>
              {/* Default redirect to home */}
              <Route path="/" element={<Navigate to="/home" />} />

              {/* Public Routes */}
              <Route path="/home" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                {/* Donor Only */}
                <Route
                  path="/donate"
                  element={
                    <RoleRoute allowedRoles={["donor"]}>
                      <DonationPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/mydonations"
                  element={
                    <RoleRoute allowedRoles={["donor"]}>
                      <Donations />
                    </RoleRoute>
                  }
                />

                {/* Donor + Needy/NGO can view available food */}
                <Route
                  path="/available"
                  element={
                    <RoleRoute allowedRoles={["donor", "needy", "ngo"]}>
                      <AvailableFoodPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/requests"
                  element={
                    <RoleRoute allowedRoles={["donor"]}>
                      <DonorRequestsPage />
                    </RoleRoute>
                  }
                />


                {/* Needy/NGO Only */}
                <Route
                  path="/requestfood"
                  element={
                    <RoleRoute allowedRoles={["needy", "ngo"]}>
                      <RequestFood />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/myrequests"
                  element={
                    <RoleRoute allowedRoles={["needy", "ngo"]}>
                      <MyRequests />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/request-details/:id"
                  element={
                    <RoleRoute allowedRoles={["needy", "ngo"]}>
                      <RequestDetails />
                    </RoleRoute>
                  }
                />

                {/* Volunteer Only */}
                <Route
                  path="/pickuprequests"
                  element={
                    <RoleRoute allowedRoles={["volunteer"]}>
                      <PickupRequests />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/mydeliveries"
                  element={
                    <RoleRoute allowedRoles={["volunteer"]}>
                      <MyDeliveries />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <RoleRoute allowedRoles={['admin']}>
                      <AdminPanel />
                    </RoleRoute>
                  }
                />

                {/* All Logged-in Users */}
                <Route path="/profile" element={<ProfilePage />} />

              </Route>

            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
