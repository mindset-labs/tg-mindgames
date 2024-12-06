import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { App } from "../../screens/Wallet";
import { Game } from "../../screens/Game";
import { CreateWallet } from "../../screens/Wallet/Create";
import { WalletHome } from "../../screens/Wallet/Home";
import { Landing } from "../../screens/Wallet/Landing";
import { Settings } from "../../screens/Settings";
import { Swap } from "../../screens/Wallet/Swap";
import { Receive } from "../../screens/Wallet/Receive";
import { Send } from "../../screens/Wallet/Send";
import { Test } from "../../screens/Test";

const router = createBrowserRouter([
  {
    path: "/tg-app",
    element: <App />,
  },
  {
    path: "/tg-app/landing",
    element: <Landing />,
  },
  {
    path: "/tg-app/wallet/home",
    element: <WalletHome />,
  },
  {
    path: "/tg-app/wallet/create",
    element: <CreateWallet />,
  },
  {
    path: "/tg-app/wallet/lockscreen",
    element: <div>Rooms</div>,
  },
  {
    path: "/tg-app/wallet/swap",
    element: <Swap />,
  },
  {
    path: "/tg-app/wallet/receive",
    element: <Receive />,
  },
  {
    path: "/tg-app/wallet/send",
    element: <Send />,
  },
  {
    path: "/tg-app/settings",
    element: <Test />,
  },
  {
    path: "/tg-app/game",
    element: <Game />,
  },
  {
    path: "/tg-app/game/rooms",
    element: <div>Rooms</div>,
  },
]);

export const Router = () => {
  return <RouterProvider router={router} />;
};
