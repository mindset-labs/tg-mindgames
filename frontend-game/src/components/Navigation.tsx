import { GamepadIcon, Users2Icon, Settings2Icon, HomeIcon } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    {
      id: "home",
      icon: HomeIcon,
      label: "Home",
      path: "/tg-app/game/",
    },
    {
      id: "games",
      icon: GamepadIcon,
      label: "Games",
      path: "/tg-app/game/create",
    },
    {
      id: "rooms",
      icon: Users2Icon,
      label: "Rooms",
      path: "/tg-app/game/rooms",
    },
    {
      id: "settings",
      icon: Settings2Icon,
      label: "Settings",
      path: "/tg-app/settings",
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none">
      <div
        className="max-w-md mx-auto bg-[#1f1635]/80 backdrop-blur-md rounded-2xl 
                    border border-purple-500/10 shadow-lg pointer-events-auto"
      >
        <div className="flex justify-around p-2">
          {tabs.map(({ id, icon: Icon, label, path }) => (
            <button
              key={id}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center py-2 px-2 sm:px-4 rounded-xl transition-all min-w-[64px] sm:min-w-[80px]
                ${
                  isActive(path)
                    ? "bg-[#160f28]/80 text-blue-400 scale-105 shadow-lg shadow-blue-500/20"
                    : "text-gray-400 hover:text-gray-300 hover:bg-[#160f28]/50"
                }
                group relative`}
            >
              <Icon
                className={`w-5 h-5 mb-1 transition-all duration-200
                  ${
                    isActive(path)
                      ? "text-blue-400"
                      : "text-gray-400 group-hover:text-gray-300"
                  }`}
                strokeWidth={2.5}
              />
              <span
                className={`text-[10px] sm:text-xs font-medium transition-all duration-200 whitespace-nowrap
                ${
                  isActive(path)
                    ? "text-blue-400"
                    : "text-gray-400 group-hover:text-gray-300"
                }`}
              >
                {label}
              </span>

              {/* Active indicator line */}
              {isActive(path) && (
                <div
                  className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 sm:w-12 h-1 
                              bg-[#2adaff] rounded-full"
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
