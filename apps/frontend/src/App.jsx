import { BrowserRouter, Route, Routes } from "react-router-dom";

import MyContextProvider from "./context/MyContext.jsx";
import NotificationPopup from "./components/NotificationComponent.jsx";

import PublicRoute from "./PublicRoute.jsx"
import PrivateRoute from "./PrivateRoute.jsx"
import LandingPage from "../src/pages/LandingPage.jsx";
import LoginPage from "../src/pages/LoginPage.jsx";
import RegisterPage from "../src/pages/RegisterPage.jsx";

function App() {
  return (
    <MyContextProvider>
      <NotificationPopup />

      {/* routes */}
      <BrowserRouter>
        <Routes>
          <Route path="/"         element={<PublicRoute><LandingPage />     </PublicRoute>} />
          <Route path="/login"    element={<PublicRoute><LoginPage />       </PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage />    </PublicRoute>} />
          <Route path="/home"     element={<PrivateRoute><h1>Logged In</h1> </PrivateRoute>} />
        </Routes>
      </BrowserRouter>
      
    </MyContextProvider>
  );
}

export default App;
