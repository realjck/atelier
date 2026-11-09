import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/inter";
import "./styles/tokens.css";
import "./styles/app.css";
import App from "./App";
import { applyTheme, initialTheme } from "./lib/theme";

// Before the first render, so the page never flashes in the wrong theme.
applyTheme(initialTheme());

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
