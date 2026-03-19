import React, { useEffect } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    const handlePopState = () => {
      const currentToken =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      if (!currentToken) {
        navigate("/login", { replace: true });
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [token, navigate]);

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}