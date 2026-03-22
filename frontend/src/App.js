import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import EditProfilePage from "./pages/EditProfilePage";
import ConsultationPage from "./pages/ConsultationPage";
import Report1 from "./pages/Report1";
import Report2 from "./pages/Report2";
import Report3 from "./pages/Report3";
import Report4 from "./pages/Report4";
import Report5 from "./pages/Report5";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile/edit"
        element={
          <ProtectedRoute>
            <EditProfilePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/consultation"
        element={
          <ProtectedRoute>
            <ConsultationPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/report1"
        element={
          <ProtectedRoute>
            <Report1 />
          </ProtectedRoute>
        }
      />

      <Route
        path="/report2"
        element={
          <ProtectedRoute>
            <Report2 />
          </ProtectedRoute>
        }
      />

      <Route
        path="/report3"
        element={
          <ProtectedRoute>
            <Report3 />
          </ProtectedRoute>
        }
      />

      <Route
        path="/report4"
        element={
          <ProtectedRoute>
            <Report4 />
          </ProtectedRoute>
        }
      />

      <Route
        path="/report5"
        element={
          <ProtectedRoute>
            <Report5 />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}