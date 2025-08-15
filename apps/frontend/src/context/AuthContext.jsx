import { createContext, useContext, useState, useEffect } from "react";

export const AuthContext = createContext();
export const useAuthContext = () => useContext(AuthContext);

const AuthContextProvider = ({ children }) => {
  const backendApiUrl = "http://127.0.0.1:8000";
  const backendWsUrl = "ws://127.0.0.1:8000";
  const loginUrl = backendApiUrl + "/auth/login/";
  const refreshUrl = backendApiUrl + "/auth/refresh/";
  const registerUrl = backendApiUrl + "/auth/register/";
  const profileUrl = backendApiUrl + "/auth/profile/";

  const [accessToken, setAccessToken] = useState(
    localStorage.getItem("accessToken")
  );
  const [refreshToken, setRefreshToken] = useState(
    localStorage.getItem("refreshToken")
  );
  const [loggedIn, setLoggedIn] = useState(!!accessToken);
  const [profileData, setProfileData] = useState(
    JSON.parse(localStorage.getItem("profileData") || "{}")
  );

  const registerUser = async (email, username, password) => {
    const res = await fetch(registerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, username, password }),
    });
    let data = await res.json();
    return data.success ? [true, null] : [false, data.error];
  };

  const fetchProfile = async (token) => {
    try {
      const res = await fetch(profileUrl, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfileData(data);
        localStorage.setItem("profileData", JSON.stringify(data));
      }
    } catch (err) {
      console.error("Profile fetch failed", err);
    }
  };

  const loginUser = async (username, password) => {
    const res = await fetch(loginUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      const data = await res.json();
      setAccessToken(data.access);
      setRefreshToken(data.refresh);
      localStorage.setItem("accessToken", data.access);
      localStorage.setItem("refreshToken", data.refresh);
      setLoggedIn(true);
      fetchProfile(data.access);
      return true;
    }
    return false;
  };

  const logoutUser = () => {
    setAccessToken(null);
    setRefreshToken(null);
    setProfileData({});
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("profileData");
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
          fetchProfile(data.access);
        } else {
          logoutUser();
        }
      }, 4 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [refreshToken]);

  useEffect(() => {
    if (accessToken && !profileData.username) {
      fetchProfile(accessToken);
    }
  }, [accessToken]);

  return (
    <AuthContext.Provider
      value={{
        backendApiUrl,
        backendWsUrl,
        loggedIn,
        profileData,
        registerUser,
        loginUser,
        logoutUser,
        accessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContextProvider;
