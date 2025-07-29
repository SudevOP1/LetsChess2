import { createContext, useContext } from "react";
import AuthContextProvider, { useAuthContext } from "./AuthContext";
import NotificationContextProvider, { useNotificationContext } from "./NotificationContext";

export const MyContext = createContext();
export const useMyContext = () => useContext(MyContext);

const MyContextInner = ({ children }) => {
  const auth = useAuthContext();
  const notification = useNotificationContext();

  return (
    <MyContext.Provider value={{ ...auth, ...notification }}>
      {children}
    </MyContext.Provider>
  );
};

const MyContextProvider = ({ children }) => {
  return (
    <AuthContextProvider>
      <NotificationContextProvider>
        <MyContextInner>
          {children}
        </MyContextInner>
      </NotificationContextProvider>
    </AuthContextProvider>
  );
};

export default MyContextProvider;