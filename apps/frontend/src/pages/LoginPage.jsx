import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

import { useAuthContext } from "../context/AuthContext";
import Button from "../components/ui/Button";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const { accessToken, loginUser, loading } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (accessToken) {
      navigate(location.state?.from || "/");
    }
  }, [accessToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await loginUser(username, password, location.state?.from || "/");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md bg-surface border border-surface-hover rounded-xl overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-purple-500 to-pink-500" />

        <div className="p-8">
          <div className="flex flex-col items-center mb-8">
            <h2 className="text-2xl font-bold text-text-strong">Welcome Back</h2>
            <p className="text-text mt-2">Login to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-strong mb-1">
                Username <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="flex h-10 w-full rounded-md border border-text-weak bg-surface px-3 py-2 text-sm text-strong
                  placeholder:text-text-weak focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-strong mb-1">
                Password <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                placeholder="•••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="flex h-10 w-full rounded-md border border-text-weak bg-surface px-3 py-2 text-sm text-strong
                  placeholder:text-text-weak focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <Button
              type="submit"
              isLoading={loading}
              className="w-full mt-6"
              disabled={loading || username === "" || password === ""}
            >
              {loading ? "Logging in..." : "Log In"}
            </Button>
          </form>

          <p className="text-center text-text mt-6 text-sm">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary hover:text-primary-hover hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
