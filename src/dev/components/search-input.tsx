import React from "react";

import { ConfigTable } from "@/dev/lib/store";

export const SearchInput = () => {
  const search = ConfigTable.use()?.filter ?? "";

  return (
    <div className="flex items-center gap-4 h-6">
      Search
      <input
        type="text"
        className="min-w-64 border-none bg-base-800 text-base-500 px-2 py-1"
        placeholder="Search"
        value={search}
        onChange={(e) => ConfigTable.update({ filter: e.target.value })}
      />
      <button
        className="border-none px-2 py-1 bg-base-800 text-base-150 hover:bg-base-700 cursor-pointer"
        onClick={() => ConfigTable.update({ filter: "" })}
      >
        clear
      </button>
    </div>
  );
};
