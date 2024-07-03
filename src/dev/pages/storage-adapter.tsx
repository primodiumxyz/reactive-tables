import React, { useState } from "react";

import { StorageAdapterData, Title, type UpdateTableQueryOptions } from "@/dev/components";

export const StorageAdapterPage = () => {
  const [queryOptions, setQueryOptions] = useState<Partial<UpdateTableQueryOptions>>({});

  return (
    <div>
      <div className="mb-2 flex flex-col gap-2">
        <Title>Storage adapter</Title>
        <div className="flex justify-between gap-4">
          <div className="text-xs text-base-500">Click on a cell to copy its content</div>
          <button
            className="border-none px-2 py-1 bg-base-800 text-base-150 text-xs hover:bg-base-700 cursor-pointer"
            onClick={() => setQueryOptions({})}
          >
            clear filters
          </button>
        </div>
      </div>
      <StorageAdapterData queryOptions={queryOptions} setQueryOptions={setQueryOptions} />
    </div>
  );
};
