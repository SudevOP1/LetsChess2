import { useState } from "react";
import PageWithHeader from "../components/PageWithHeader";
import { useMyContext } from "../context/MyContext.jsx";

const HomePage = () => {
  let { profileData } = useMyContext();
  let [loadingGame, setLoadingGame] = useState(false);

  return (
    <PageWithHeader classNames="flex flex-col items-start gap-3">
      <h1 className="text-lime-300 text-3xl sm:text-4xl font-semibold mt-6 break-words">
        Hello{" " + profileData.username || ", welcome"}
      </h1>
      <h1 className="text-lime-300 text-xl sm:text-2xl font-light">
        Are you ready for another challenge?
      </h1>
      <button
        className="bg-lime-300 text-slate-950 text-xl sm:text-2xl mt-6 
        font-semibold rounded-full px-5 py-2 w-[60%] sm:w-[35%] cursor-pointer"
      >
        {loadingGame ? "Finding..." : "Find Game"}
      </button>
    </PageWithHeader>
  );
};

export default HomePage;
