import React from "react";
import { Outlet } from "react-router-dom";
import { twMerge } from "tailwind-merge";

import { NavButton } from "@/lib/dev/components/nav-button";

export const RootPage = () => {
  return (
    <>
      <div className="flex-none bg-slate-900 text-white/60 font-medium">
        <NavButton
          to="/"
          className={({ isActive }) =>
            twMerge("py-1.5 px-3", isActive ? "bg-slate-800 text-white" : "hover:bg-blue-800 hover:text-white")
          }
        >
          Home
        </NavButton>
        <NavButton
          to="/components"
          className={({ isActive }) =>
            twMerge("py-1.5 px-3", isActive ? "bg-slate-800 text-white" : "hover:bg-blue-800 hover:text-white")
          }
        >
          Tables
        </NavButton>
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
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </>
  );
};
