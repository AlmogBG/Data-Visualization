import React, {
  Suspense,
  lazy,
} from "react";

import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import LoginPage from "./pages/LoginPage";

import ProtectedRoute from "./components/ProtectedRoute";

import RoleProtectedRoute from "./components/RoleProtectedRoute";

const HomePage = lazy(() =>
  import("./pages/HomePage")
);

const EditProfilePage = lazy(() =>
  import("./pages/EditProfilePage")
);

const ConsultationPage = lazy(() =>
  import("./pages/ConsultationPage")
);

const Report1 = lazy(() =>
  import("./pages/Report1")
);

const Report2 = lazy(() =>
  import("./pages/Report2")
);

const Report3 = lazy(() =>
  import("./pages/Report3")
);

const Report4 = lazy(() =>
  import("./pages/Report4")
);

const Report5 = lazy(() =>
  import("./pages/Report5")
);

const SecurityDashboard = lazy(() =>
  import("./pages/SecurityDashboard")
);

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

function ManagerRoute({ children }) {
  return (
    <RoleProtectedRoute
      allowedRoles={["Manager"]}
    >
      {children}
    </RoleProtectedRoute>
  );
}

export default function App() {
  return (
    <Suspense
      fallback={<PageLoader />}
    >
      <Routes>
        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

        <Route
          path="/login"
          element={<LoginPage />}
        />

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
            <ManagerRoute>
              <Report1 />
            </ManagerRoute>
          }
        />

        <Route
          path="/report2"
          element={
            <ManagerRoute>
              <Report2 />
            </ManagerRoute>
          }
        />

        <Route
          path="/report3"
          element={
            <ManagerRoute>
              <Report3 />
            </ManagerRoute>
          }
        />

        <Route
          path="/report4"
          element={
            <ManagerRoute>
              <Report4 />
            </ManagerRoute>
          }
        />

        <Route
          path="/report5"
          element={
            <ManagerRoute>
              <Report5 />
            </ManagerRoute>
          }
        />

        <Route
          path="/security"
          element={
            <ManagerRoute>
              <SecurityDashboard />
            </ManagerRoute>
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />
      </Routes>
    </Suspense>
  );
}