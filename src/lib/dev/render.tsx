import React from "react";
import { createMemoryRouter, createRoutesFromElements, Route, RouterProvider } from "react-router-dom";
import "tailwindcss/tailwind.css";

import { HomePage, RootPage, TablesPage } from "@/lib/dev/pages";
import { RouteError, TableData } from "@/lib/dev/components";
import type { VisualizerOptions } from "@/lib/dev/config/types";

const containerId = "RETA_DEV_VISUALIZER";

const router = createMemoryRouter(
  createRoutesFromElements(
    <Route path="/" element={<RootPage />} errorElement={<RouteError />}>
      <Route index element={<HomePage />} />
      {/* <Route path="actions" element={<ActionsPage />} /> */}
      {/* <Route path="events" element={<EventsPage />} /> */}
      <Route path="tables" element={<TablesPage />}>
        <Route path=":id" element={<TableData />} />
      </Route>
      {/* <Route path="components" element={<ComponentsPage />}>
        <Route path=":id" element={<ComponentData />} />
      </Route> */}
    </Route>,
  ),
);

export const render = async (options: VisualizerOptions): Promise<() => void> => {
  if (document.getElementById(containerId)) {
    console.warn("Dev visualizer is already mounted");
    return () => {};
  }

  try {
    const React = await import("react");
    const ReactDOM = await import("react-dom/client");
    const { VisualizerProvider } = await import("./config/context");

    const rootElement = document.createElement("div");
    rootElement.id = containerId;

    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <VisualizerProvider value={options}>
          <RouterProvider router={router} />;
        </VisualizerProvider>
      </React.StrictMode>,
    );

    document.body.appendChild(rootElement);

    return () => {
      root.unmount();
      rootElement.remove();
    };
  } catch (error) {
    console.error("Failed to mount dev visualizer", error);
    return () => {};
  }
};
