import { BrowserRouter, Route, Routes } from "react-router-dom";

import MyContextProvider from "./context/MyContext.jsx";
import NotificationPopup from "./components/NotificationComponent.jsx";

import PublicRoute from "./PublicRoute.jsx"
import PrivateRoute from "./PrivateRoute.jsx"
import LandingPage from "../src/pages/LandingPage.jsx";
import HomePage from "../src/pages/HomePage.jsx";

function App() {
  return (
    <MyContextProvider>
      <NotificationPopup />

      {/* routes */}
      <BrowserRouter>
        <Routes>
          <Route path="/"         element={<PublicRoute><LandingPage /></PublicRoute>} />
          <Route path="/home"     element={<PrivateRoute><HomePage /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
      
    </MyContextProvider>
  );
}

export default App;
