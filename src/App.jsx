// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AuthLandingPage from "./pages/AuthLandingPage";
import AuthFormPage from "./pages/AuthFormPage";
import ConfirmCodePage from "./pages/ConfirmCodePage";
import HomePage from "./pages/HomePage";
import SubmitPage from "./pages/SubmitPage";
import TrackPage from "./pages/TrackPage";
import SupportPage from "./pages/SupportPage";
import SubmitSuccessPage from "./pages/SubmitSuccessPage"; // 👈 NEW

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth flow */}
        <Route path="/" element={<AuthLandingPage />} />
        <Route path="/login" element={<AuthFormPage mode="login" />} />
        <Route path="/signup" element={<AuthFormPage mode="signup" />} />
        <Route path="/confirm" element={<ConfirmCodePage />} />

        {/* Main app */}
        <Route path="/home" element={<HomePage />} />
        <Route path="/submit" element={<SubmitPage />} />
        <Route path="/submit-success" element={<SubmitSuccessPage />} /> {/* 👈 NEW */}
        <Route path="/track" element={<TrackPage />} />
        <Route path="/support" element={<SupportPage />} />
      </Routes>
    </Router>
  );
}

export default App;
