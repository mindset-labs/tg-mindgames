import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { App } from "../../screens/Wallet";
import Game from "../../components/Game";
import { CreateWallet } from "../../screens/Wallet/Create";
import { WalletHome } from "../../screens/Wallet/Home";

const router = createBrowserRouter([
  {
    path: "/tg-app",
    element: <App />,
  },
  {
    path: "/tg-app/landing",
    element: <div>Landing</div>,
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
    element: <div>Swap</div>,
  },
  {
    path: "/tg-app/wallet/receive",
    element: <div>Receive</div>,
  },
  {
    path: "/tg-app/wallet/send",
    element: <div>Send</div>,
  },
  {
    path: "/tg-app/settings",
    element: <div>Settings</div>,
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
