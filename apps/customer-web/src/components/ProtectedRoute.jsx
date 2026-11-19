import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../authContext";
import SessionStatus from "./SessionStatus";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, error } = useAuth();
  const location = useLocation();

  if (isLoading || error) return <SessionStatus />;

  if (isAuthenticated) {
    return children;
  }

  return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
};

export default ProtectedRoute;
