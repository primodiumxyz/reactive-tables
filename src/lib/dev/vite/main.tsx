import React, { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
// import "./index.css";

import { createWrapper } from "@/createWrapper";
import { createDevVisualizer } from "@/lib/dev";
import mudConfig from "@test/contracts/mud.config";

const App = () => {
  const { tables } = createWrapper({ mudConfig });
  tables.Counter.properties;

  useEffect(() => {
    let unmount: () => void | undefined;
    const open = async () => {
      unmount = await createDevVisualizer({ tables });
    };

    open();
    return () => unmount?.();
  }, [tables]);

  return null;
};

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <div className="App">
      <App />
    </div>
  </StrictMode>,
);
