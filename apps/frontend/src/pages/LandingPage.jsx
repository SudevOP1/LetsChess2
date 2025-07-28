import React from "react";

const LandingPage = () => {
  return (
    <div className="flex flex-col w-1/2 p-10">
      <h1 className="text-5xl font-bold mb-5">LandingPage</h1>
      <a className="text-4xl text-blue-600 underline" href="/login">
        Login
      </a>
      <br />
      <a className="text-4xl text-blue-600 underline" href="/signup">
        Signup
      </a>
    </div>
  );
};

export default LandingPage;
