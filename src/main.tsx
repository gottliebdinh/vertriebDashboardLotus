import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { migrateLegacyIndexedDB } from "./db/database";
import { migrateLegacyLocalStorage } from "./migrateStorage";
import "./index.css";

migrateLegacyLocalStorage();

void migrateLegacyIndexedDB().then(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});
