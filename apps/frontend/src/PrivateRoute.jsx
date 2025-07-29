import { Navigate } from "react-router-dom";
import { useAuthContext } from "./context/AuthContext.jsx";

const PrivateRoute = ({ children }) => {
  const { loggedIn } = useAuthContext();
  return loggedIn ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
