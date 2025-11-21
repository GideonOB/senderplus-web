import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AuthLandingPage from "./pages/AuthLandingPage";
import ConfirmCodePage from "./pages/ConfirmCodePage";
import ChooseActionPage from "./pages/ChooseActionPage";
import SubmitPage from "./pages/SubmitPage";
import TrackPage from "./pages/TrackPage";

function App() {
  return (
    <Router>
      <Routes>
        {/* Step 1: Login / Sign up / Skip */}
        <Route path="/" element={<AuthLandingPage />} />

        {/* Step 2: Confirmation code (demo) */}
        <Route path="/confirm" element={<ConfirmCodePage />} />

        {/* Step 3: Choose to send or track */}
        <Route path="/start" element={<ChooseActionPage />} />

        {/* Existing pages */}
        <Route path="/submit" element={<SubmitPage />} />
        <Route path="/track" element={<TrackPage />} />
      </Routes>
    </Router>
  );
}

export default App;
