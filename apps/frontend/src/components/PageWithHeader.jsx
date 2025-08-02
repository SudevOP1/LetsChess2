import wn from "../assets/pieces/neo/wn.png";

const PageWithHeader = ({ children, classNames }) => {
  return (
    <div className="bg-slate-950 w-full min-h-screen flex flex-col px-[15%] py-8">
      {/* header */}
      <div className="flex flex-row items-center pb-2 text-4xl sm:text-6xl">
        <h1 className="text-amber-600 font-bold mr-[-10px]">
          LetsChess
        </h1>
        <img src={wn} className="w-17 h-17" />
      </div>
      <div className={`w-full h-full ${classNames}`}>{children}</div>
    </div>
  );
};

export default PageWithHeader;
