import React, { SVGProps } from "react";
import { createMemoryRouter, createRoutesFromElements, Route, RouterProvider } from "react-router-dom";

import type { Tables } from "@/tables/types";
import type { ContractTableDefs, StoreConfig } from "@/lib/definitions";
import { ConfigPage, EntitiesPage, HomePage, QueryPage, RootPage, TablesPage, StorageAdapterPage } from "@/dev/pages";
import { RouteError, TableData } from "@/dev/components";
import { BUTTON_STYLES, CONTAINER_ID } from "@/dev/lib/constants";
import type { DevToolsProps } from "@/dev/lib/types";

const Icon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={16} height={24} viewBox="0 0 576 512" {...props}>
    {/* <!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--> */}
    <path d="M413.5 237.5c-28.2 4.8-58.2-3.6-80-25.4L295.4 174c-15-15-23.4-35.2-23.4-56.4v-12.1L192.3 62c-5.3-2.9-8.6-8.6-8.3-14.7s3.9-11.5 9.5-14l47.2-21C259.1 4.2 279 0 299.2 0h18.1c36.7 0 72 14 98.7 39.1l44.6 42c24.2 22.8 33.2 55.7 26.6 86L503 183l8-8c9.4-9.4 24.6-9.4 33.9 0l24 24c9.4 9.4 9.4 24.6 0 33.9l-88 88c-9.4 9.4-24.6 9.4-33.9 0l-24-24c-9.4-9.4-9.4-24.6 0-33.9l8-8-17.5-17.5zM27.4 377.1l233.5-194.5c3.5 4.9 7.5 9.6 11.8 14l38.1 38.1c6 6 12.4 11.2 19.2 15.7L134.9 484.6C120.4 502 98.9 512 76.3 512 34.1 512 0 477.8 0 435.7c0-22.6 10.1-44.1 27.4-58.6z" />
  </svg>
);

const router = createMemoryRouter(
  createRoutesFromElements(
    <Route path="/" element={<RootPage />} errorElement={<RouteError />}>
      <Route index element={<HomePage />} />
      <Route path="tables" element={<TablesPage />}>
        <Route path=":id" element={<TableData />} />
      </Route>
      <Route path="storage-adapter" element={<StorageAdapterPage />} />
      <Route path="entities" element={<EntitiesPage />} />
      <Route path="query" element={<QueryPage />} />
      <Route path="config" element={<ConfigPage />} />
    </Route>,
  ),
);

export const mount = async <
  config extends StoreConfig,
  extraTableDefs extends ContractTableDefs | undefined,
  otherDevTables extends Tables | undefined,
>(
  options: DevToolsProps<config, extraTableDefs, otherDevTables>,
): Promise<() => void> => {
  // if dev tools are already here, return early
  if (document.getElementById(CONTAINER_ID)) {
    console.warn("Dev tools is already mounted");
    return () => {};
  }

  // check that the flag is set to true; if it is, mount (replace the dom with devtools)
  const params = new URLSearchParams(window.location.search);
  if (params.get("devtools")) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore inconsistent too complex union type error
    return await render(options);
  }

  // render the dev tools button to open in a new tab with flag set to true (which will mount)
  try {
    const React = await import("react");
    const ReactDOM = await import("react-dom/client");

    const rootElement = document.createElement("div");
    rootElement.id = CONTAINER_ID;
    const root = ReactDOM.createRoot(rootElement);

    const style = document.createElement("style");
    style.innerHTML = BUTTON_STYLES;
    document.head.appendChild(style);

    let unmount: () => void | undefined;

    root.render(
      <React.StrictMode>
        <button
          id="devtools-button"
          onClick={() => {
            const url = new URL(window.location.href);
            url.searchParams.set("devtools", "true");
            window.open(url.href, "_blank");
          }}
        >
          <Icon />
        </button>
      </React.StrictMode>,
    );

    document.body.appendChild(rootElement);

    return () => {
      unmount?.();
      root.unmount();
      rootElement.remove();
    };
  } catch (error) {
    console.error("Failed to mount dev tools", error);
    return () => {};
  }
};

export const render = async <
  config extends StoreConfig,
  extraTableDefs extends ContractTableDefs | undefined,
  otherDevTables extends Tables | undefined,
>(
  options: DevToolsProps<config, extraTableDefs, otherDevTables>,
): Promise<() => void> => {
  // replace the dom with devtools
  document.title = "Dev Tools";
  document.body.innerHTML = `<div id="devtools-root"></div>`;
  const link = window.document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/src/dev/lib/styles.css";
  window.document.head.appendChild(link);

  try {
    const React = await import("react");
    const ReactDOM = await import("react-dom/client");
    const { DevToolsProvider } = await import("./lib/context");

    const rootElement = document.getElementById("devtools-root");
    if (!rootElement) throw new Error("Failed to find root element");
    const root = ReactDOM.createRoot(rootElement);

    root.render(
      <React.StrictMode>
        <DevToolsProvider value={options}>
          <RouterProvider router={router} />
        </DevToolsProvider>
      </React.StrictMode>,
    );

    document.body.appendChild(rootElement);

    return () => {
      root.unmount();
      rootElement.remove();
    };
  } catch (error) {
    console.error("Failed to mount dev tools", error);
    return () => {};
  }
};