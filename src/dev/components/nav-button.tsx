import React, { type ButtonHTMLAttributes, type DetailedHTMLProps } from "react";
import { type To, useLocation, useResolvedPath, useNavigate } from "react-router-dom";
import { twMerge } from "tailwind-merge";

import { DEFAULT_CONFIG } from "@/dev/lib/constants";
import { ConfigTable } from "@/dev/lib/store";

type ButtonProps = DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;

type Props = ButtonProps & {
  to: To;
};

export const NavButton = ({ to, className, type, onClick, ...buttonProps }: Props) => {
  const navigate = useNavigate();
  const path = useResolvedPath(to);
  const location = useLocation();

  const toPathname = path.pathname;
  const locationPathname = location.pathname;

  // https://github.com/remix-run/react-router/blob/main/packages/react-router-dom/index.tsx#L572-L576
  const isActive =
    locationPathname === toPathname ||
    (locationPathname.startsWith(toPathname) && locationPathname.charAt(toPathname.length) === "/");

  return (
    <button
      type={type || "button"}
      className={twMerge(
        "px-4 py-1 border-none shadow-none bg-base-950 text-base-50 text-sm hover:bg-base-850 focus:outline-none cursor-pointer",
        isActive && "bg-base-800",
        className,
      )}
      onClick={(event) => {
        ConfigTable.set({ ...ConfigTable.get(undefined, DEFAULT_CONFIG), route: path.pathname });
        navigate(to);
        onClick?.(event);
      }}
      {...buttonProps}
    />
  );
};
