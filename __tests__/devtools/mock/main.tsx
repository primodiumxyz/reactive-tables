import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "@test/devtools/mock/app";

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <div className="App">
      <App />
    </div>
  </StrictMode>,
);
