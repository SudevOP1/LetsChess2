import { BrowserRouter, Route, Routes } from "react-router-dom";

import NotificationContextProvider from "./context/NotificationContext.jsx";
import NotificationPopup from "./components/NotificationComponent.jsx";

import LandingPage from '../src/pages/LandingPage.jsx'
import LoginPage from '../src/pages/LoginPage.jsx'
import RegisterPage from '../src/pages/RegisterPage.jsx'

function App() {
  return (
    <NotificationContextProvider>
      <NotificationPopup />
      <BrowserRouter>
        <Routes>
          <Route path="/"           element={<LandingPage />} />
          <Route path="/login"      element={<LoginPage />} />
          <Route path="/register"   element={<RegisterPage />} />
        </Routes>
      </BrowserRouter>
    </NotificationContextProvider>
  );
}

export default App;
