import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { useToastContext } from "../../context/ToastContext";

const Toast = ({ id, text = "", color = "red", time = 3 }) => {
  const { removeToast } = useToastContext();
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);

      setTimeout(() => {
        removeToast(id);
      }, 500);
    }, time * 1000);

    return () => clearTimeout(timer);
  }, [id, time]);

  const colors = {
    red: {
      text: "text-red-300",
      button: "text-red-300 hover:text-red-100 hover:bg-red-500/30",
      outerDiv: "border-red-400 bg-red-500/40",
      barAnimation: "border-red-400",
    },
    green: {
      text: "text-green-300",
      button: "text-green-300 hover:text-green-100 hover:bg-green-500/30",
      outerDiv: "border-green-400 bg-green-500/40",
      barAnimation: "border-green-400",
    },
    gray: {
      text: "text-gray-300",
      button: "text-gray-300 hover:text-gray-100 hover:bg-gray-500/30",
      outerDiv: "border-gray-300 bg-gray-500/40",
      barAnimation: "border-gray-300",
    },
  };

  return (
    <div
      className={`relative w-fit min-w-sm max-w-lg border rounded-xl flex flex-col
        overflow-hidden backdrop-blur-lg ${colors[color].outerDiv}`}
      style={{
        animation: isExiting ? "slideOut 0.5s ease forwards" : "slideIn 0.5s ease forwards",
      }}
    >
      <div className="flex justify-between items-center px-2 py-2">
        <span className={`${colors[color].text}`}>{text}</span>
        <button
          onClick={() => {
            setIsExiting(true);
            setTimeout(() => removeToast(id), 300);
          }}
          className={`cursor-pointer transition rounded-lg hover:font-bold p-1 ${colors[color].button}`}
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="w-full rounded">
        <div
          className={`h-full border-b-3 rounded ${colors[color].barAnimation}`}
          style={{
            animation: `shrink ${String(time)}s linear forwards`,
            width: "100%",
          }}
        />
      </div>
    </div>
  );
};

export default Toast;
