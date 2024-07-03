import React, { FC, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export const Title: FC<{ children: string | ReactNode; className?: string }> = ({ children, className }) => (
  <h1 className={twMerge("my-2 font-bold text-base-500 uppercase text-xs", className)}>{children}</h1>
);
