import { createContext, useContext, useState, useEffect } from "react";

export const AuthContext = createContext();
export const useAuthContext = () => useContext(AuthContext);

const AuthContextProvider = ({ children }) => {
  const backendUrl = "http://127.0.0.1:8000";
  const loginUrl = `${backendUrl}/auth/login/`;
  const refreshUrl = `${backendUrl}/auth/refresh/`;
  const registerUrl = `${backendUrl}/auth/register/`;

  const [accessToken, setAccessToken] = useState(localStorage.getItem("accessToken"));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem("refreshToken"));
  const [loggedIn, setLoggedIn] = useState(!!accessToken);

  const registerUser = async (email, username, password) => {
    const res = await fetch(registerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email,
        username: username,
        password: password,
      }),
    });

    let data = await res.json();

    if (data.success) {
      return [true, null];
    } else {
      return [false, data.error];
    }
  };

  const loginUser = async (username, password) => {
    const res = await fetch(loginUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username, password: password }),
    });

    if (res.ok) {
      const data = await res.json();
      setAccessToken(data.access);
      setRefreshToken(data.refresh);
      localStorage.setItem("accessToken", data.access);
      localStorage.setItem("refreshToken", data.refresh);
      setLoggedIn(true);
      return true;
    }

    console.log(res);
    return false;
  };

  const logoutUser = () => {
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setLoggedIn(false);
  };

  useEffect(() => {
    if (refreshToken) {
      const interval = setInterval(async () => {
        const res = await fetch(refreshUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh: refreshToken }),
        });
        if (res.ok) {
          const data = await res.json();
          setAccessToken(data.access);
          localStorage.setItem("accessToken", data.access);
        } else {
          logoutUser();
        }
      }, 4 * 60 * 1000); // refresh every 4 min
      return () => clearInterval(interval);
    }
  }, [refreshToken]);

  return (
    <AuthContext.Provider
      value={{ loggedIn, registerUser, loginUser, logoutUser, accessToken }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContextProvider;
