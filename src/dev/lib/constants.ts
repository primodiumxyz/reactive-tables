export const CONTAINER_ID = "RETA_DEV_TOOLS";
export const BUTTON_ID = "RETA_DEV_TOOLS_BUTTON";

export const BUTTON_STYLES = `
${BUTTON_ID} button {
  background: rgb(242 240 229);
  position: absolute;
  bottom: 8px;
  right: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: none;
  border-radius: 0.1rem;
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 0.2s;
}
#devtools-button:hover {
  opacity: 1;
}
`;
