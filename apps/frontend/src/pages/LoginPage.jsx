import { useContext, useState } from "react";
import { useNotificationContext } from "../context/NotificationContext";

const LoginPage = () => {
  let [username, setUsername] = useState("");
  let [password, setPassword] = useState("");

  let {addNotification} = useNotificationContext();

  let handleLogin = () => {
  };

  return (
    <div className="flex flex-col w-1/2 p-10">
      <h1 className="text-5xl font-bold mb-5">LoginPage</h1>
      <div className="flex gap-3">
        <label htmlFor="username">username</label>
        <input
          type="text"
          value={username}
          name="username"
          id="username"
          onChange={(e) => setUsername(e.target.value)}
          className="border-1 border-black mb-5 flex-1"
        />
      </div>
      <div className="flex gap-3">
        <label htmlFor="password">password</label>
        <input
          type="password"
          value={password}
          name="password"
          id="password"
          onChange={(e) => setPassword(e.target.value)}
          className="border-1 border-black mb-5 flex-1"
        />
      </div>
      <button onClick={handleLogin} className="border-1 border-black cursor-pointer">Submit</button>
    </div>
  );
};

export default LoginPage;
