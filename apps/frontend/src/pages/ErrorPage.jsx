import { useNavigate } from "react-router-dom";
import PageWithHeader from "../components/PageWithHeader";

const ErrorPage = () => {
  let navigate = useNavigate();
  return (
    <PageWithHeader classNames="flex flex-col gap-1">
      <h1 className="text-lime-300 text-3xl sm:text-4xl font-semibold mt-6 break-words">
        OOPS!
      </h1>
      <h1 className="text-lime-300 text-xl sm:text-2xl font-light">
        You entered a broken URL
      </h1>
      <button
        className="bg-lime-300 text-slate-950 text-xl sm:text-2xl mt-6
        font-semibold rounded-full px-5 py-2 w-[60%] sm:w-[35%] cursor-pointer"
        onClick={() => navigate("/home")}
      >
        Go Home
      </button>
    </PageWithHeader>
  );
};

export default ErrorPage;
