import {
  CircleAlert,
  CircleX,
  CircleCheck,
  TriangleAlert,
  X,
} from "lucide-react";
import { useNotificationContext } from "../context/NotificationContext";

const NotificationPopup = () => {
  let { notifications, removeNotification } = useNotificationContext();
  if (!notifications.length) return null;
  let notificationColors = {
    success: {
      bg: "bg-green-200/95",
      text: "text-green-700",
      border: "border-green-700",
    },
    info: {
      bg: "bg-blue-200/95",
      text: "text-blue-700",
      border: "border-blue-700",
    },
    warning: {
      bg: "bg-yellow-200/95",
      text: "text-yellow-700",
      border: "border-yellow-700",
    },
    error: {
      bg: "bg-red-200/95",
      text: "text-red-700",
      border: "border-red-700",
    },
  };

  let getIcon = (errType) => {
    if (errType === "success") {
      return <CircleCheck className="w-5 h-5" />;
    }
    if (errType === "info") {
      return <CircleAlert className="w-5 h-5" />;
    }
    if (errType === "warning") {
      return <TriangleAlert className="w-5 h-5" />;
    }
    if (errType === "error") {
      return <CircleX className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2">
      {notifications.map((err) => (
        <div
          key={err.id}
          className={`font-semibold border-1 px-2 py-1 rounded flex
          items-center justify-between w-100 ${
            notificationColors[err.type].bg
          } ${notificationColors[err.type].text} ${
            notificationColors[err.type].border
          }
            `}
        >
          {getIcon(err.type)}
          <span className="ml-2 text-left flex-1">{err.msg}</span>
          <button onClick={() => removeNotification(err.id)} className="ml-1">
            <X className="w-4 h-4 cursor-pointer hover:color-black" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationPopup;
