import { Entity, Has, defineComponentSystem, namespaceWorld, runQuery } from "@latticexyz/recs";
import { entityToAddress } from "src/util/common";
import { decodeEntity } from "src/util/encode";
import { getPrivateKey } from "src/util/localStorage";
import { Address, Hex } from "viem";
import { components } from "../components";
import { world } from "../world";

export const setupSessionAccount = (
  playerEntity: Entity,
  removeSessionAccount: () => void,
  updateSessionAccount: (privateKey: Hex) => void
) => {
  world.dispose("session");
  const authorizedWorld = namespaceWorld(world, "session");
  const potentialAuthorizeds = Array.from(runQuery([Has(components.UserDelegationControl)])).reduce((prev, entity) => {
    const key = decodeEntity(components.UserDelegationControl.metadata.keySchema, entity) as {
      delegator: Address;
      delegatee: Address;
    };
    if (key.delegator !== entityToAddress(playerEntity)) return prev;
    return [...prev, key.delegatee];
  }, [] as Address[]);

  potentialAuthorizeds.find((authorized) => {
    return setAuthorized(authorized);
  });

  function setAuthorized(authorized: string) {
    const privateKey = getPrivateKey(entityToAddress(authorized));
    if (!privateKey) return false;
    updateSessionAccount(privateKey);
    return true;
  }

  defineComponentSystem(
    authorizedWorld,
    components.UserDelegationControl,
    ({ entity, value }) => {
      const key = decodeEntity(components.UserDelegationControl.metadata.keySchema, entity);
      if (key.delegator !== entityToAddress(playerEntity)) return;
      const newAuthorized = key.delegatee;
      if (!value[0]) return removeSessionAccount();
      setAuthorized(newAuthorized as string);
    },
    { runOnInit: false }
  );
};
