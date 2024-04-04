import { ValueOrUndefined } from "tinybase/debug";
import { useSetValueCallback } from "tinybase/debug/ui-react";

export const Button = () => {
  // Attach events to the buttons to mutate the data in the TinyBase Store
  const handleCount = useSetValueCallback("counter", () => (value: ValueOrUndefined) => ((value ?? 0) as number) + 1);

  return <button onClick={handleCount}>Increment number</button>;
};
