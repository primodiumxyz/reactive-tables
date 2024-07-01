import { describe, expect, it } from "vitest";
import { configure, render, screen } from "@testing-library/react";
import { Window } from "happy-dom";
import React from "react";

// src
import { BUTTON_ID, CONTAINER_ID } from "@/dev/lib/constants";

// test
import { App } from "@test/devtools/mock/app";

configure({ testIdAttribute: "id" });

describe("Dev Tools", () => {
  const createWindow = ({ mounted = false }) => {
    // @ts-expect-error 'Window' is not assignable to type 'Window & typeof globalThis'
    window = new Window({
      url: `http://localhost:3000?devtools=${mounted}`,
    });
  };

  it("should correctly render the button to visit dev tools on the original app", async () => {
    createWindow({ mounted: false });
    render(<App />);

    const button = await screen.findByTestId(BUTTON_ID);
    expect(button).toBeDefined();
    expect(button.querySelector("svg")).toBeDefined();

    const container = document.getElementById(CONTAINER_ID);
    expect(container).toBeNull();
  });

  it("should directly render dev tools if the flag is set to true", async () => {
    createWindow({ mounted: true });
    render(<App />);

    const container = await screen.findByTestId(CONTAINER_ID);
    expect(container).toBeDefined();
    console.log(container);

    const button = document.getElementById(BUTTON_ID);
    expect(button).toBeNull();
  });
});
