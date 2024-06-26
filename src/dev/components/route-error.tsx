import React from "react";
import { useRouteError } from "react-router-dom";

const ErrorTrace = ({ error }: { error: unknown }) => {
  return (
    <div className="font-mono text-xs whitespace-pre overflow-auto bg-red-900/50 text-white p-4 rounded">
      {error instanceof Error ? error.stack : String(error)}
    </div>
  );
};

export const RouteError = () => {
  const error = useRouteError();

  return (
    <div className="p-6 space-y-6">
      <p>
        Whoops, something broke! Please{" "}
        <a
          href={`https://github.com/latticexyz/mud/issues/new?${new URLSearchParams({
            body: `
**Steps to reproduce**

1. Go to …
2. Click on …
3. Scroll down to …
4. See error

**Expected behavior**

A clear and concise description of what you expected to happen.

**Error**
\`\`\`
${error instanceof Error ? error.stack : String(error)}
\`\`\`
`,
          })}`}
          target="_blank"
          className="text-white underline"
        >
          report the issue
        </a>{" "}
        so we can look into it.
      </p>
      <ErrorTrace error={error} />
    </div>
  );
};
