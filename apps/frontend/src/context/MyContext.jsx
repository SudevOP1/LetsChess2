import { createContext, useContext } from "react";
import AuthContextProvider, { useAuthContext } from "./AuthContext";
import NotificationContextProvider, { useNotificationContext } from "./NotificationContext";
import ThemeContextProvider, { useThemeContext } from "./ThemeContext";

export const MyContext = createContext();
export const useMyContext = () => useContext(MyContext);

const MyContextInner = ({ children }) => {
  const auth = useAuthContext();
  const notification = useNotificationContext();
  const theme = useThemeContext();

  return (
    <MyContext.Provider value={{ ...auth, ...notification, ...theme }}>
      {children}
    </MyContext.Provider>
  );
};

const MyContextProvider = ({ children }) => {
  return (
    <AuthContextProvider>
      <NotificationContextProvider>
        <ThemeContextProvider>
          <MyContextInner>
            {children}
          </MyContextInner>
        </ThemeContextProvider>
      </NotificationContextProvider>
    </AuthContextProvider>
  );
};

export default MyContextProvider;