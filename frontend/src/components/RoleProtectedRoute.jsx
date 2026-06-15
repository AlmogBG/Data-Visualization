import React from "react";
import { Navigate, useLocation } from "react-router-dom";

function getStoredRole() {
  const directRole =
    localStorage.getItem("loggedInRole") ||
    sessionStorage.getItem("loggedInRole");

  if (directRole) {
    return directRole;
  }

  try {
    const storedUser =
      localStorage.getItem("user") ||
      sessionStorage.getItem("user");

    if (!storedUser) {
      return "";
    }

    const user = JSON.parse(storedUser);
    return user?.role || "";
  } catch (error) {
    console.error("Failed to read stored user role:", error);
    return "";
  }
}

export default function RoleProtectedRoute({
  children,
  allowedRoles = [],
}) {
  const location = useLocation();

  const token =
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  const role = getStoredRole();

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/home" replace />;
  }

  return children;
}