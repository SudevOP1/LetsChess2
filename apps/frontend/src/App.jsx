import { BrowserRouter, Route, Routes } from "react-router-dom";
import LandingPage from '../src/pages/LandingPage.jsx'
import LoginPage from '../src/pages/LoginPage.jsx'
import SignupPage from '../src/pages/SignupPage.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"           element={<LandingPage />} />
        <Route path="/login"      element={<LoginPage />} />
        <Route path="/signup"     element={<SignupPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
