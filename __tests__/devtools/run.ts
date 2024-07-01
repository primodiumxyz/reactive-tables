import { createWrapper } from "src/index";

import mudConfig from "../contracts/mud.config";
import { networkConfig } from "../utils";

const setup = () => ({
  ...createWrapper({
    mudConfig,
    devTools: { enabled: true, publicClient: networkConfig.publicClient, worldAddress: networkConfig.worldAddress },
  }),
});

setup();
