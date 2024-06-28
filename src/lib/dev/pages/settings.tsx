import React from "react";

import { SettingsTable } from "@/lib/dev/config/settings";
import { Properties } from "@/lib/external/mud/schema";

export const SettingsPage = () => {
  const settings = SettingsTable.use() as Properties<(typeof SettingsTable)["propertiesSchema"]>; // default values provided

  const updateSettings = (properties: Partial<Properties<(typeof SettingsTable)["propertiesSchema"]>>) => {
    SettingsTable.set({ ...settings, ...properties });
  };

  return (
    <div className="grid grid-cols-[min-content_1fr] gap-4">
      <span className="whitespace-nowrap">Shrink entities in tables</span>
      <input
        type="checkbox"
        className="w-4 h-4"
        checked={settings?.shrinkEntities}
        onChange={(e) => updateSettings({ shrinkEntities: e.target.checked })}
      />
    </div>
  );
};
