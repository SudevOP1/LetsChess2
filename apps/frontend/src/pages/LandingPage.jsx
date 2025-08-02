import { useState } from "react";
import { useMyContext } from "../context/MyContext.jsx";
import sampleBoard from "../assets/sampleBoard.png";
import { useNavigate } from "react-router-dom";
import PageWithHeader from "../components/PageWithHeader.jsx";

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
        setAuthType("login");
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
    <PageWithHeader
      classNames={`flex flex-col sm:flex-row justify-between gap-6 items-center ${
        authType === "login" ? "sm:flex-row" : "sm:flex-row-reverse"
      }`}
    >
      <div
        className="flex flex-col bg-blue-400/20 justify-between text-lime-300
        w-full sm:w-[55%] px-8 py-8 rounded-3xl gap-10 max-h-[70%]"
      >
        <h1 className="text-2xl sm:text-3xl font-bold">
          {capitalize(authType)}
        </h1>

        <div className="flex flex-col gap-4">
          {authType === "register" && (
            <input
              type="email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded-full bg-lime-300/20 text-lime-300
              px-4 py-2 border-2 border-lime-300 outline-none"
            />
          )}
          <input
            type="text"
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full rounded-full bg-lime-300/20 text-lime-300
            px-4 py-2 border-2 border-lime-300 outline-none"
          />
          <input
            type="password"
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-full bg-lime-300/20 text-lime-300
            px-4 py-2 border-2 border-lime-300 outline-none"
          />
          <button
            className="w-full rounded-full bg-lime-300 text-blue-950
            px-4 py-2 cursor-pointer font-bold"
            onClick={handleSubmit}
          >
            SUBMIT
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-row w-full items-center">
            <div className="border-b border-lime-300 flex-1" />
            <span className="text-lime-300 font-bold text-xl px-3">OR</span>
            <div className="border-b border-lime-300 flex-1" />
          </div>
          <button
            className="w-full rounded-full bg-transparent text-lime-300
            px-4 py-2 cursor-pointer font-bold border-2 border-lime-300"
            onClick={() => setAuthType(getOtherAuthType())}
          >
            {getOtherAuthType().toUpperCase()} INSTEAD
          </button>
        </div>
      </div>

      <div className="flex justify-center items-center w-full sm:w-[40%]">
        <img
          src={sampleBoard}
          className="rounded-3xl object-contain max-h-[300px] sm:max-h-[500px] w-full"
        />
      </div>
    </PageWithHeader>
  );
};

export default LandingPage;
