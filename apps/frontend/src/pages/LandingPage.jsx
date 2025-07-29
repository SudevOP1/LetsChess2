import { useState } from "react";

import { useMyContext } from "../context/MyContext.jsx";
import wn from "../assets/pieces/neo/wn.png";
import sampleBoard from "../assets/sampleBoard.png";
import { useNavigate } from "react-router-dom";

const LandingPage = ({ defaultAuthType = "login" }) => {
  let [authType, setAuthType] = useState(defaultAuthType);
  let [email, setEmail] = useState("");
  let [username, setUsername] = useState("");
  let [password, setPassword] = useState("");

  let { registerUser, loginUser, addNotification } = useMyContext();
  let navigate = useNavigate();

  let handleSubmit = async () => {
    // login
    if (authType === "login") {
      if (await loginUser(username, password)) {
        navigate("/home");
      } else {
        addNotification("Invalid Credentials", "error");
      }
    }

    // register
    else {
      console.log(email, username, password);
      let [register_ok, err] = await registerUser(email, username, password);
      if (register_ok) {
        addNotification("Registration Successful! Please login!", "success");
      } else {
        addNotification(err, "error");
      }
    }
  };

  let capitalize = (str) => {
    if (!str) return "";
    return str[0].toUpperCase() + str.slice(1);
  };

  let getOtherAuthType = () => {
    return authType === "login" ? "register" : "login";
  };

  return (
    <div className="bg-slate-950 w-full min-h-screen flex flex-col justify-center gap-10 px-[15%]">
      {/* title */}
      <div className="flex flex-row items-center">
        <h1 className="text-amber-600 text-6xl font-bold mr-[-10px]">
          LetsChess
        </h1>
        <img src={wn} className="w-17 h-17" />
      </div>

      <div
        className={`flex w-full justify-between gap-10 ${
          authType === "login" ? "flex-row" : "flex-row-reverse"
        }`}
      >
        {/* auth card */}
        <div
          className="flex flex-col bg-blue-400/20 justify-between text-lime-300
          h-full px-12 py-10 rounded-3xl gap-10 flex-1"
        >
          {/* authType */}
          <h1 className="text-3xl font-bold">{capitalize(authType)}</h1>

          {/* inputs */}
          <div className="flex flex-col gap-4">
            {/* email input */}
            {authType === "register" && (
              <input
                type="email"
                id="email"
                name="email"
                content="email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full rounded-full bg-lime-300/20 text-lime-300
              px-4 py-2 border-2 border-lime-300"
              />
            )}
            {/* username input */}
            <input
              type="text"
              id="username"
              name="username"
              content="username"
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full rounded-full bg-lime-300/20 text-lime-300
              px-4 py-2 border-2 border-lime-300"
            />
            {/* password input */}
            <input
              type="password"
              id="password"
              name="password"
              content="password"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-full bg-lime-300/20 text-lime-300
              px-4 py-2 border-2 border-lime-300"
            />
            <button
              className="w-full rounded-full bg-lime-300 text-slate-950
              px-4 py-2 cursor-pointer font-bold"
              onClick={handleSubmit}
            >
              SUBMIT
            </button>
          </div>

          {/* other authType */}
          <div className="flex flex-col gap-2">
            {/* OR */}
            <div className="flex flex-row w-full items-center">
              <div className="h-[50%] border-1 border-b-lime-300 flex-1 rounded-full" />
              <span className="text-lime-300 font-bold text-2xl px-3">OR</span>
              <div className="h-[50%] border-1 border-b-lime-300 flex-1 rounded-full" />
            </div>
            {/* instead button */}
            <button
              className="w-full rounded-full bg-transparent text-lime-300
              px-4 py-2 cursor-pointer font-bold border-2 bordeer-lime-300"
              onClick={() => setAuthType(getOtherAuthType())}
            >
              {getOtherAuthType().toUpperCase()}
            </button>
          </div>
        </div>

        <img
          src={sampleBoard}
          className="rounded-3xl object-contain w-[40%] max-h-[500px] self-center"
        />
      </div>
    </div>
  );
};

export default LandingPage;
