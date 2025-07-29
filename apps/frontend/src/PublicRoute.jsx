import { Navigate } from "react-router-dom";
import { useAuthContext } from "./context/AuthContext.jsx";

const PublicRoute = ({ children }) => {
  const { loggedIn } = useAuthContext();
  return loggedIn ? <Navigate to="/home" /> : children;
};

export default PublicRoute;
