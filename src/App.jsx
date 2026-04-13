// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AuthLandingPage from "./pages/AuthLandingPage";
import ConfirmCodePage from "./pages/ConfirmCodePage";
import HomePage from "./pages/HomePage";
import SubmitPage from "./pages/SubmitPage";
import TrackPage from "./pages/TrackPage";
import SupportPage from "./pages/SupportPage";
import SubmitSuccessPage from "./pages/SubmitSuccessPage";
import { ThemeProvider } from "./themeContext";
import { AuthProvider } from "./authContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ProfilePage from "./pages/ProfilePage";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<AuthLandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/confirm" element={<ConfirmCodePage />} />

            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/submit"
              element={
                <ProtectedRoute>
                  <SubmitPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/submit-success"
              element={
                <ProtectedRoute>
                  <SubmitSuccessPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/track"
              element={
                <ProtectedRoute>
                  <TrackPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/support"
              element={
                <ProtectedRoute>
                  <SupportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
