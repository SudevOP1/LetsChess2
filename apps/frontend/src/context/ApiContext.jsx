import { createContext, useContext } from "react";

import { useToastContext } from "./ToastContext.jsx";
import { useAuthContext } from "./AuthContext.jsx";

const ApiContext = createContext();

export const useApiContext = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error("useApiContext must be used within an ApiProvider");
  }
  return context;
};

export const ApiProvider = ({ children }) => {
  const { addToast } = useToastContext();
  const { accessToken, logoutUser } = useAuthContext();

  const fetchApi = async (url, method = "GET", body = null, setLoading = null, sendAccessToken = true) => {
    if (setLoading) setLoading(true);
    try {
      const fetchOptions = {};
      fetchOptions.method = method;
      if (body !== null) {
        fetchOptions.body = JSON.stringify(body);
        fetchOptions.headers = {
          ...fetchOptions.headers,
          "Content-Type": "application/json",
        };
      }
      if (sendAccessToken) {
        fetchOptions.headers = {
          ...fetchOptions.headers,
          Authorization: `Bearer ${accessToken}`,
        };
      }

      // fetch the api
      const res = await fetch(url, fetchOptions);
      const data = await res.json().catch(() => null);

      // unsuccessful api call
      if (!res.ok) {
        if (data && ["token expired", "invalid token"].includes(data.error)) {
          addToast("Session expired, Please login again", "red", 5);
          logoutUser(false);
          return [false, data.error];
        }
        return [false, data?.error || `Request failed (${res.status})`];
      } else {
        // expired or invalid token
        if (["token expired", "invalid token"].includes(data.error)) {
          addToast("Session expired, Please login again", "red", 5);
          logoutUser(false);
          return [false, data.error];
        }

        // successful api call
        if (data?.success) return [true, data];
      }
    } catch (err) {
      // handle network error
      console.error("something went wrong: " + err);
      addToast("Something went wrong", "red", 5);
      return [false, "Something went wrong"];
    } finally {
      if (setLoading) setLoading(false);
    }
  };

  const contextData = { fetchApi: fetchApi };

  return <ApiContext.Provider value={contextData}>{children}</ApiContext.Provider>;
};

export default ApiContext;
