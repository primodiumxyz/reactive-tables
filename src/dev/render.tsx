import React from "react";
import { createMemoryRouter, createRoutesFromElements, Route, RouterProvider } from "react-router-dom";
import "tailwindcss/tailwind.css";

import type { Tables } from "@/tables/types";
import { ConfigPage, HomePage, RootPage, TablesPage, StorageAdapterPage } from "@/dev/pages";
import { RouteError, TableData } from "@/dev/components";
import { CONTAINER_ID } from "@/dev/lib/constants";
import type { VisualizerOptions } from "@/dev/lib/types";
import type { ContractTableDefs, StoreConfig } from "@/lib/definitions";

const router = createMemoryRouter(
  createRoutesFromElements(
    <Route path="/" element={<RootPage />} errorElement={<RouteError />}>
      <Route index element={<HomePage />} />
      {/* <Route path="actions" element={<ActionsPage />} /> */}
      {/* <Route path="events" element={<EventsPage />} /> */}
      <Route path="tables" element={<TablesPage />}>
        <Route path=":id" element={<TableData />} />
      </Route>
      <Route path="storage-adapter" element={<StorageAdapterPage />} />
      <Route path="config" element={<ConfigPage />} />
      {/* <Route path="components" element={<ComponentsPage />}>
        <Route path=":id" element={<ComponentData />} />
      </Route> */}
    </Route>,
  ),
);

export const render = async <
  config extends StoreConfig,
  extraTableDefs extends ContractTableDefs | undefined,
  otherDevTables extends Tables | undefined,
>(
  options: VisualizerOptions<config, extraTableDefs, otherDevTables>,
): Promise<() => void> => {
  if (document.getElementById(CONTAINER_ID)) {
    console.warn("Dev visualizer is already mounted");
    return () => {};
  }

  try {
    const React = await import("react");
    const ReactDOM = await import("react-dom/client");
    const { VisualizerProvider } = await import("./lib/context");

    const rootElement = document.createElement("div");
    rootElement.id = CONTAINER_ID;

    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <VisualizerProvider value={options}>
          <RouterProvider router={router} />
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
