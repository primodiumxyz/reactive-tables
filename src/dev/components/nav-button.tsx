import React, { type ButtonHTMLAttributes, type DetailedHTMLProps } from "react";
import { type To, useLocation, useResolvedPath, useNavigate } from "react-router-dom";
import { twMerge } from "tailwind-merge";

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
        "border-none px-4 py-1 text-sm bg-base-950 text-base-50 hover:bg-base-850 cursor-pointer",
        isActive && "bg-base-800",
        className,
      )}
      onClick={(event) => {
        navigate(to);
        ConfigTable.update({ route: to.toString() });
        onClick?.(event);
      }}
      {...buttonProps}
    />
  );
};
