import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext.jsx";
import { ApiProvider } from "./context/ApiContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import BrokenURL from "./pages/BrokenURL.jsx";
import MainPage from "./pages/MainPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import FindGamePage from "./pages/FindGamePage.jsx";
import GamePage from "./pages/GamePage.jsx";

const App = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <ApiProvider>
            <Routes>

              {/* routes with navbar & footer */}
              <Route    path="/" element={<Layout showNavbar={true} showFooter={true} />}>
                <Route  index                       element={<MainPage />} />
                <Route  path="/login"               element={<LoginPage />} />
                <Route  path="/signup"              element={<SignupPage />} />
                <Route  path="*"                    element={<BrokenURL />} />
              </Route>

              {/* routes without navbar & footer */}
              <Route    path="/" element={<Layout showNavbar={false} showFooter={false} />}>
                <Route  path="/find-game"           element={<ProtectedRoute><FindGamePage /></ProtectedRoute>} />
                <Route  path="/game/:gameId"        element={<ProtectedRoute><GamePage /></ProtectedRoute>} />
              </Route>

            </Routes>
          </ApiProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
