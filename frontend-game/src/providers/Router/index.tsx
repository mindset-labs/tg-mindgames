import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { App } from "../../screens/Game/";
import { CreateGame } from "../../screens/Game/Create";
import { GameHome } from "../../screens/Game/Home";
import { Landing } from "../../screens/Game/Landing";
import { Rooms } from "../../screens/Game/Rooms";
import { Settings } from "../../screens/Settings";

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
    path: "/tg-app/game/",
    element: <GameHome />,
  },
  {
    path: "/tg-app/game/create",
    element: <CreateGame />,
  },
  {
    path: "/tg-app/game/rooms",
    element: <Rooms />,
  },
  {
    path: "/tg-app/game/settings",
    element: <Settings />,
  },
]);

export const Router = () => {
  return <RouterProvider router={router} />;
};