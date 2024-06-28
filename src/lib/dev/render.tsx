import React from "react";
import { createMemoryRouter, createRoutesFromElements, Route, RouterProvider } from "react-router-dom";
import "tailwindcss/tailwind.css";

import { SettingsPage, HomePage, RootPage, TablesPage } from "@/lib/dev/pages";
import { RouteError, TableData } from "@/lib/dev/components";
import { CONTAINER_ID } from "@/lib/dev/config/constants";
import type { VisualizerOptions } from "@/lib/dev/config/types";
import type { Tables } from "@/tables/types";
import { padHex, toHex } from "viem";

const router = createMemoryRouter(
  createRoutesFromElements(
    <Route path="/" element={<RootPage />} errorElement={<RouteError />}>
      <Route index element={<HomePage />} />
      {/* <Route path="actions" element={<ActionsPage />} /> */}
      {/* <Route path="events" element={<EventsPage />} /> */}
      <Route path="tables" element={<TablesPage />}>
        <Route path=":id" element={<TableData />} />
      </Route>
      <Route path="config" element={<SettingsPage />} />
      {/* <Route path="components" element={<ComponentsPage />}>
        <Route path=":id" element={<ComponentData />} />
      </Route> */}
    </Route>,
  ),
);

export const render = async <tables extends Tables>(options: VisualizerOptions<tables>): Promise<() => void> => {
  if (document.getElementById(CONTAINER_ID)) {
    console.warn("Dev visualizer is already mounted");
    return () => {};
  }

  try {
    const React = await import("react");
    const ReactDOM = await import("react-dom/client");
    const { VisualizerProvider } = await import("./config/context");

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
    const getEntity = (index: number) => padHex(toHex(index));
    for (let i = 0; i < 100; i++) {
      options.tables.Inventory.set(
        { items: [1, 3, 5, 3, 3, 3, 3, 4, 5], weights: [i, 3], totalWeight: BigInt(4) },
        getEntity(i),
      );
    }

    return () => {
      root.unmount();
      rootElement.remove();
    };
  } catch (error) {
    console.error("Failed to mount dev visualizer", error);
    return () => {};
  }
};
