import React from "react";

import { ConfigTable } from "@/dev/lib/store";
import { Properties } from "@/lib/external/mud/schema";

export const ConfigPage = () => {
  const config = ConfigTable.use() as Properties<(typeof ConfigTable)["propertiesSchema"]>; // default values provided

  const updateSettings = (properties: Partial<Properties<(typeof ConfigTable)["propertiesSchema"]>>) => {
    ConfigTable.set({ ...config, ...properties });
  };

  return (
    <div className="grid grid-cols-[min-content_1fr] gap-4">
      <span className="whitespace-nowrap">Shrink entities in tables</span>
      <input
        type="checkbox"
        className="w-4 h-4 cursor-pointer"
        checked={config?.shrinkEntities}
        onChange={(e) => updateSettings({ shrinkEntities: e.target.checked })}
      />
    </div>
  );
};
