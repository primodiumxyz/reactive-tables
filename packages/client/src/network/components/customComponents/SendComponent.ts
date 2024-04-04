import { Entity, Type } from "@latticexyz/recs";
import { world } from "src/network/world";
import { createExtendedComponent } from "./ExtendedComponent";

function createSendComponent() {
  const component = createExtendedComponent(world, {
    originFleet: Type.OptionalEntity,
    destination: Type.OptionalEntity,
  });

  const emptyComponent = {
    destination: undefined,
    originFleet: undefined,
  };

  const reset = () => {
    component.set(emptyComponent);
  };

  const setOrigin = (fleet: Entity) => {
    if (!component.get()) reset();
    component.update({ originFleet: fleet });
  };

  const setDestination = (spaceRock: Entity | undefined) => {
    if (!component.get()) reset();
    component.update({ destination: spaceRock });
  };

  return {
    ...component,
    setOrigin,
    setDestination,
    reset,
  };
}

export default createSendComponent;
