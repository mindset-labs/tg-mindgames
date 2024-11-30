import { useNavigate } from "react-router-dom";

export const App = () => {
  //TODO: Routing to pages
  // If first time opening game
  // If Wallet Created
  // If Wallet not Created
  const navigate = useNavigate();

  return (
    <div>
      <h1>Main App</h1>
      <p onClick={() => navigate("/tg-app/game")}>Go to Game</p>
      <p onClick={() => navigate("/tg-app/wallet/home")}>Go to Wallet</p>
    </div>
  );
};
