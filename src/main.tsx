import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./app/App";
import { AuthGate } from "./modules/auth/ui/AuthGate";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthGate>
      {(workspace) => <App key={workspace.storageScope ?? "local"} {...workspace} />}
    </AuthGate>
  </React.StrictMode>,
);
