import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";

const HomePage = lazy(() => import("./pages/HomePage"));
const EditProfilePage = lazy(() => import("./pages/EditProfilePage"));
const ConsultationPage = lazy(() => import("./pages/ConsultationPage"));
const Report1 = lazy(() => import("./pages/Report1"));
const Report2 = lazy(() => import("./pages/Report2"));
const Report3 = lazy(() => import("./pages/Report3"));
const Report4 = lazy(() => import("./pages/Report4"));
const Report5 = lazy(() => import("./pages/Report5"));

function PageLoader() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        background: "#2e3038",
        fontSize: "18px",
      }}
    >
      טוען...
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
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
    </Suspense>
  );
}