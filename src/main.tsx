import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { migrateLegacyIndexedDB } from "./db/database";
import { migrateLegacyLocalStorage } from "./migrateStorage";
import "./index.css";

migrateLegacyLocalStorage();

async function boot() {
  try {
    await migrateLegacyIndexedDB();
  } catch (e) {
    console.warn("[Lotus & Eagle] IndexedDB-Migration übersprungen:", e);
  }

  const rootEl = document.getElementById("root");
  if (!rootEl) {
    console.error("#root fehlt im HTML");
    return;
  }

  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

void boot();
