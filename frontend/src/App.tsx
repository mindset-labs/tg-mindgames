import Navigation from "./components/Navigation";
import "./index.css";
import { Router } from "./providers/Router";

function App() {
  return (
    <div className=" min-h-screen w-full items-center z-10 overflow-hidden">
      <Router />
    </div>
  );
}

export default App;
