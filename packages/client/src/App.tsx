import { StrictMode } from "react";
import { createStore } from "tinybase";
import { Provider, useCreateStore } from "tinybase/debug/ui-react";
import { StoreInspector, ValuesInHtmlTable } from "tinybase/debug/ui-react-dom";
import { Button } from "./Button";

export const App = () => {
  const store = useCreateStore(() => {
    // Create the TinyBase Store and initialize the Store's data
    return createStore().setValue("counter", 0);
  });

  return (
    <StrictMode>
      <Provider store={store}>
        <Button />
        <div>
          <h2>Values</h2>
          <ValuesInHtmlTable />
        </div>
        <StoreInspector />
      </Provider>
    </StrictMode>
  );
};
