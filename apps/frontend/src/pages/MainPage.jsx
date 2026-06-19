import { useAuthContext } from "../context/AuthContext";
import LoadingScreen from "../components/LoadingScreen";
import LandingPage from "../pages/LandingPage";
import HomePage from "../pages/HomePage";

const MainPage = () => {
  const { user, accessToken, loading } = useAuthContext();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!accessToken || !user) {
    return <LandingPage />;
  } else {
    return <HomePage />;
  }
};

export default MainPage;
