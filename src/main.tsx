import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./styles/index.css";
import { startKeepAlive } from "./services/keepAlive";

startKeepAlive();

createRoot(document.getElementById("root")!).render(<App />);
  