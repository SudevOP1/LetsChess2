import React, { useState } from "react";

const SignupPage = () => {
  let [username, setUsername] = useState("");
  let [email, setEmail] = useState("");
  let [password, setPassword] = useState("");

  let handleSignup = () => {};

  return (
    <div className="flex flex-col w-1/2 p-10">
      <h1 className="text-5xl font-bold mb-5">SignupPage</h1>
      <div className="flex gap-3">
        <label for="username">username</label>
        <input
          type="text"
          value={username}
          name="username"
          id="username"
          onChange={(e) => setUsername(e)}
          className="border-1 border-black mb-5 flex-1"
        />
      </div>
      <div className="flex gap-3">
        <label for="email">email</label>
        <input
          type="email"
          value={email}
          name="email"
          id="email"
          onChange={(e) => setEmail(e)}
          className="border-1 border-black mb-5 flex-1"
        />
      </div>
      <div className="flex gap-3">
        <label for="password">password</label>
        <input
          type="password"
          value={password}
          name="password"
          id="password"
          onChange={(e) => setPassword(e)}
          className="border-1 border-black mb-5 flex-1"
        />
      </div>
      <button onClick={handleSignup} className="border-1 border-black cursor-pointer">Submit</button>
    </div>
  );
};

export default SignupPage;
