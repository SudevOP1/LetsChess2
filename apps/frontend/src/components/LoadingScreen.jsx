import Loader from "./ui/Loader.jsx";

const LoadingScreen = () => {
  return (
    <div className="flex justify-center items-center h-screen">
      <p className="flex flex-row gap-3 items-center text-2xl text-secondary">
        <Loader size="lg" /> Loading...
      </p>
    </div>
  );
};

export default LoadingScreen;
