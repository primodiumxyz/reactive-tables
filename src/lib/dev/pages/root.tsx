import React from "react";
import { Outlet } from "react-router-dom";

import { NavButton } from "@/lib/dev/components/nav-button";

export const RootPage = () => {
  return (
    <div className="flex flex-col gap-4 w-full min-h-[100vh]">
      <div>
        <NavButton to="/">Home</NavButton>
        <NavButton to="/tables">Tables</NavButton>
        {/* <NavButton
          to="/actions"
          className={({ isActive }) =>
            twMerge("py-1.5 px-3", isActive ? "bg-slate-800 text-white" : "hover:bg-blue-800 hover:text-white")
          }
        >
          Actions
        </NavButton>
        <NavButton
          to="/events"
          className={({ isActive }) =>
            twMerge("py-1.5 px-3", isActive ? "bg-slate-800 text-white" : "hover:bg-blue-800 hover:text-white")
          }
        >
          Store log
        </NavButton>
        {useStore ? (
          <NavButton
            to="/tables"
            className={({ isActive }) =>
              twMerge("py-1.5 px-3", isActive ? "bg-slate-800 text-white" : "hover:bg-blue-800 hover:text-white")
            }
          >
            Tables
          </NavButton>
        ) : null} */}
      </div>
      <div className="flex-1 px-2 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
};
