import React, { type ButtonHTMLAttributes, type DetailedHTMLProps } from "react";
import { type To, useLocation, useResolvedPath, useNavigate } from "react-router-dom";

type ButtonProps = DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;

type Props = Omit<ButtonProps, "className"> & {
  to: To;
  className?: string | ((args: { isActive: boolean }) => string);
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
      className={typeof className === "function" ? className({ isActive }) : className}
      onClick={(event) => {
        navigate(to);
        onClick?.(event);
      }}
      {...buttonProps}
    />
  );
};
