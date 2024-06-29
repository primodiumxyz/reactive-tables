import React from "react";

import { SearchInput, StorageAdapterData } from "@/dev/components";

export const StorageAdapterPage = () => {
  return (
    <div>
      <div className="mb-2 flex flex-col gap-2">
        <h1 className="font-bold text-base-500 uppercase text-xs">Storage adapter</h1>
        <SearchInput />
        <div className="text-xs text-base-500">Click on a cell to copy its content</div>
      </div>
      <StorageAdapterData />
    </div>
  );
};
