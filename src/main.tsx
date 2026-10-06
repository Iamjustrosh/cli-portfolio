import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import { config } from "./data/config";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary homeUrl={config.mainSiteUrl}>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
