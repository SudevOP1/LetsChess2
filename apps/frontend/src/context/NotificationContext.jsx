import { createContext, useContext, useState } from "react";

export const NotificationContext = createContext();
export const useNotificationContext = () => useContext(NotificationContext);

let NotificationContextProvider = ({ children }) => {
  let [notifications, setNotifications] = useState([]);

  let removeNotification = (id) => {
    setNotifications((prev) => prev.filter((e) => e.id !== id));
  };

  let addNotification = (msg, type="error", time=5000) => {
    let id = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    setNotifications((prev) => [...prev, { id: id, msg: msg, type: type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((e) => e.id !== id));
    }, time);
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContextProvider;
