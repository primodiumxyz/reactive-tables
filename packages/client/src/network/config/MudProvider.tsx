import { ReactNode, createContext } from "react";
import { MUD } from "src/network/types";

export const MudContext = createContext<MUD | null>(null);

type Props = MUD & {
  children: ReactNode;
};

export const MudProvider = ({ children, ...value }: Props) => {
  return <MudContext.Provider value={value}>{children}</MudContext.Provider>;
};
