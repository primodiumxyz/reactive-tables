import React from "react";

import { ConfigTable } from "@/dev/lib/store";

export const SearchInput = () => {
  const search = ConfigTable.use()?.filter ?? "";

  return (
    <div className="flex items-center gap-4 h-6">
      Search
      <input
        type="text"
        className="h-6 px-2 py-0 border-none bg-base-800 text-base-500 text-xs"
        style={{ minWidth: 256 }} // override defaults
        placeholder="Search an entity or property"
        value={search}
        onChange={(e) => ConfigTable.update({ filter: e.target.value })}
      />
      <button
        className="h-6 px-2 py-1 border-none bg-base-800 text-base-150 hover:bg-base-700 text-xs cursor-pointer"
        onClick={() => ConfigTable.update({ filter: "" })}
      >
        clear
      </button>
    </div>
  );
};
