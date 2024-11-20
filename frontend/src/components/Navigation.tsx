import React from "react";
import {
  GamepadIcon,
  Users2Icon,
  ArrowLeftRightIcon,
  Settings2Icon,
} from "lucide-react";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Navigation({
  activeTab,
  onTabChange,
}: NavigationProps) {
  const tabs = [
    { id: "games", icon: GamepadIcon, label: "Games" },
    { id: "rooms", icon: Users2Icon, label: "Rooms" },
    { id: "swaps", icon: ArrowLeftRightIcon, label: "Swaps" },
    { id: "settings", icon: Settings2Icon, label: "Settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-indigo-950/90 backdrop-blur-md border-t border-indigo-900">
      <div className="max-w-md mx-auto flex justify-around mb-2">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex flex-col items-center py-3 px-5 transition-colors ${
              activeTab === id
                ? "text-blue-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            <Icon className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
