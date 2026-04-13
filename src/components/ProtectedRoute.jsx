import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../authContext";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isDemoMode } = useAuth();

  if (isAuthenticated || isDemoMode) {
    return children;
  }

  return <Navigate to="/login" replace />;
};

export default ProtectedRoute;
