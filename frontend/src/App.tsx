import React, { useState } from "react";
import Game from "./components/Game";
import Navigation from "./components/Navigation";
import { Brain } from "lucide-react";
import SwapPage from "./components/SwapPage";
import RoomPage from "./components/RoomPage";
import SettingsPage from "./components/SettingsPage";

function App() {
  const [activeTab, setActiveTab] = useState("games");

  const renderContent = () => {
    switch (activeTab) {
      case "games":
        return <Game />;
      case "rooms":
        return <RoomPage />;
      case "swaps":
        return <SwapPage />;
      case "settings":
        return <SettingsPage />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-indigo-950 via-blue-900 to-blue-800 text-white">
      <header className="flex items-center justify-between p-4 bg-indigo-950/90 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6" />
          <h1 className="text-xl font-bold">Mindgames</h1>
        </div>
        <div className="text-xl font-mono" id="score"></div>
      </header>

      <main className="flex-1 relative">{renderContent()}</main>

      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

export default App;
