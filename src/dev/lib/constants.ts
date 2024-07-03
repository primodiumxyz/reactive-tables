import { StyleHTMLAttributes } from "react";

export const DEFAULT_CONFIG = {
  route: "/",
  shrinkEntities: true,
  filter: "",
};

export const CONTAINER_ID = "RETA_DEV_TOOLS";
export const BUTTON_ID = "RETA_DEV_TOOLS_BUTTON";

export const BUTTON_STYLES = {
  background: "rgb(242 240 229)",
  position: "absolute",
  bottom: "8px",
  right: "8px",
  padding: "0.3rem",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  border: "none",
  borderRadius: "0.1rem",
  cursor: "pointer",
  opacity: 0.5,
  transition: "opacity 0.2s",
} as const satisfies StyleHTMLAttributes<HTMLButtonElement>["style"];
