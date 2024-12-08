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
    <nav className="fixed bottom-4 left-4 right-4">
      <div className="max-w-md mx-auto bg-indigo-950/90 backdrop-blur-md rounded-2xl border border-indigo-900/50">
        <div className="flex justify-around p-2">
          {tabs.map(({ id, icon: Icon, label, path }) => (
            <button
              key={id}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center py-2 px-4 rounded-xl transition-all ${
                isActive(path)
                  ? "text-blue-400 bg-indigo-900/50"
                  : "text-gray-400 hover:text-gray-300 hover:bg-indigo-900/30"
              }`}
            >
              <Icon className="w-5 h-5 mb-1" strokeWidth={2.5} />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
