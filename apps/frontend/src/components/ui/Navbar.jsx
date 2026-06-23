import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

import { useAuthContext } from "../../context/AuthContext.jsx";
import wn from "../../assets/pieces/neo/wn.png";
import Button from "./Button";

const Navbar = () => {
  const { userId, logoutUser } = useAuthContext();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navbarContents = {
    "Find Match": {
      condition: userId,
      type: "link",
      to: "/find-game",
      variant: "primary",
      size: "md",
    },
    Logout: {
      condition: userId,
      type: "button",
      onClick: () => logoutUser(),
      variant: "secondary",
      size: "md",
    },
    "Sign up": {
      condition: !userId,
      type: "link",
      to: "/signup",
      variant: "primary",
      size: "md",
    },
    Login: {
      condition: !userId,
      type: "link",
      to: "/login",
      variant: "secondary",
      size: "md",
    },
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800 bg-background/40 backdrop-blur-md">
      <div className="mx-auto px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <span className="text-2xl font-semibold text-white">LetsChess</span>
          <img src={wn} alt="wn" className="aspect-square w-8 -translate-x-1" />
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-2">
          {Object.entries(navbarContents).map(
            ([name, value]) =>
              value.condition &&
              (value.type === "link" ? (
                <Link to={value.to} key={name}>
                  <Button variant={value.variant} size={value.size}>
                    {name}
                  </Button>
                </Link>
              ) : (
                <Button key={name} variant={value.variant} size={value.size} onClick={value.onClick}>
                  {name}
                </Button>
              )),
          )}
        </div>

        {/* Mobile */}
        <button onClick={() => setMobileOpen((v) => !v)} className="md:hidden p-2 rounded-lg hover:bg-slate-800">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu View */}
      <div
        className={`md:hidden absolute top-full left-0 w-full bg-background border-b border-slate-800
          animate-mobile-menu ${mobileOpen ? "animate-mobile-menu-enter" : "animate-mobile-menu-exit"}`}
      >
        <div className="max-w-6xl mx-auto p-8 flex flex-col gap-2">
          {Object.entries(navbarContents).map(
            ([name, value]) =>
              value.condition &&
              (value.type === "link" ? (
                <Link to={value.to} key={name}>
                  <Button variant={value.variant} className="w-full justify-start" size={value.size}>
                    {name}
                  </Button>
                </Link>
              ) : (
                <Button
                  key={name}
                  variant={value.variant}
                  className="w-full justify-start"
                  size={value.size}
                  onClick={value.onClick}
                >
                  {name}
                </Button>
              )),
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
