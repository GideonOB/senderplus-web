// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AuthLandingPage from "./pages/AuthLandingPage";
import ConfirmCodePage from "./pages/ConfirmCodePage";
import HomePage from "./pages/HomePage";
import SubmitPage from "./pages/SubmitPage";
import TrackPage from "./pages/TrackPage";
import SupportPage from "./pages/SupportPage";

function App() {
  return (
    <Router>
      <Routes>
        {/* Step 1: Login / Sign up / Skip */}
        <Route path="/" element={<AuthLandingPage />} />

        {/* Step 2: Confirmation code (demo) */}
        <Route path="/confirm" element={<ConfirmCodePage />} />

        {/* Main app pages */}
        <Route path="/home" element={<HomePage />} />
        <Route path="/submit" element={<SubmitPage />} />
        <Route path="/track" element={<TrackPage />} />
        <Route path="/support" element={<SupportPage />} />
      </Routes>
    </Router>
  );
}

export default App;
