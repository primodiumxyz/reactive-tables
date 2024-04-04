import { createBurnerAccount, transportObserver } from "@latticexyz/common";
import { Entity } from "@latticexyz/recs";
import { singletonEntity } from "@latticexyz/store-sync/recs";
import { Cheatcodes } from "@primodiumxyz/mud-game-tools";
import { EBuilding, EResource } from "contracts/config/enums";
import encodeBytes32 from "contracts/config/util/encodeBytes32";
import IWorldAbi from "contracts/out/IWorld.sol/IWorld.abi.json";
import { toast } from "react-toastify";
import { components } from "src/network/components";
import { getNetworkConfig } from "src/network/config/getNetworkConfig";
import { buildBuilding } from "src/network/setup/contractCalls/buildBuilding";
import { createFleet } from "src/network/setup/contractCalls/createFleet";
import { removeComponent, setComponentValue } from "src/network/setup/contractCalls/dev";
import { MUD } from "src/network/types";
import { encodeEntity, hashEntities, hashKeyEntity, toHex32 } from "src/util/encode";
import { Hex, createWalletClient, fallback, getContract, http, webSocket } from "viem";
import { generatePrivateKey } from "viem/accounts";
import {
  EntityType,
  PIRATE_KEY,
  RESOURCE_SCALE,
  ResourceEntityLookup,
  ResourceEnumLookup,
  ResourceStorages,
  UtilityStorages,
} from "./constants";

const resources: Record<string, Entity> = {
  iron: EntityType.Iron,
  copper: EntityType.Copper,
  lithium: EntityType.Lithium,
  titanium: EntityType.Titanium,
  iridium: EntityType.Iridium,
  kimberlite: EntityType.Kimberlite,
  ironplate: EntityType.IronPlate,
  platinum: EntityType.Platinum,
  alloy: EntityType.Alloy,
  pvcell: EntityType.PVCell,
  housing: EntityType.Housing,
  vessel: EntityType.VesselCapacity,
  electricity: EntityType.Electricity,
  defense: EntityType.Defense,
  moves: EntityType.FleetCount,
};

const units: Record<string, Entity> = {
  stinger: EntityType.StingerDrone,
  aegis: EntityType.AegisDrone,
  anvil: EntityType.AnvilDrone,
  hammer: EntityType.HammerDrone,
  capitalShip: EntityType.CapitalShip,
  droid: EntityType.Droid,
};

export const setupCheatcodes = (mud: MUD): Cheatcodes => {
  const provideResource = async (spaceRock: Entity, resource: Entity, value: bigint) => {
    const resourceIndex = ResourceEnumLookup[resource];
    const systemCalls: Promise<unknown>[] = [];
    const entity = encodeEntity(components.ProductionRate.metadata.keySchema, {
      entity: spaceRock as Hex,
      resource: resourceIndex,
    });
    if (components.P_IsUtility.get(resource)) {
      systemCalls.push(
        setComponentValue(mud, mud.components.ProductionRate, entity, {
          value,
        })
      );
    } else {
      if (components.MaxResourceCount.get(entity)?.value ?? 0n < value)
        systemCalls.push(
          setComponentValue(mud, mud.components.MaxResourceCount, entity, {
            value,
          })
        );

      systemCalls.push(
        setComponentValue(mud, mud.components.ResourceCount, entity, {
          value,
        })
      );
    }
    await Promise.all(systemCalls);
  };

  const provideUnit = async (spaceRock: Entity, unit: Entity, value: bigint) => {
    const rockUnitEntity = encodeEntity(components.UnitCount.metadata.keySchema, {
      unit: unit as Hex,
      entity: spaceRock as Hex,
    });
    const level = components.UnitLevel.get(rockUnitEntity)?.value ?? 1n;

    const unitRequiredResources = getTrainCost(unit, level, value);

    [...unitRequiredResources.entries()].map(([resource, count]) => provideResource(spaceRock, resource, count));
    await setComponentValue(mud, mud.components.UnitCount, rockUnitEntity, {
      value,
    });
  };

  function getTrainCost(unitPrototype: Entity, level: bigint, count: bigint) {
    const requiredResources = components.P_RequiredResources.getWithKeys({ prototype: unitPrototype as Hex, level });
    const ret: Map<Entity, bigint> = new Map();
    if (!requiredResources) return ret;
    for (let i = 0; i < requiredResources.resources.length; i++) {
      const resource = ResourceEntityLookup[requiredResources.resources[i] as EResource];
      ret.set(resource, requiredResources.amounts[i] * count);
    }
    return ret;
  }

  return {
    setWorldSpeed: {
      params: [{ name: "value", type: "number" }],
      function: async (value: number) => {
        await setComponentValue(mud, mud.components.P_GameConfig, singletonEntity, {
          worldSpeed: BigInt(value),
        });
      },
    },
    stopGracePeriod: {
      params: [],
      function: async () => {
        setComponentValue(mud, components.P_GracePeriod, singletonEntity, { spaceRock: 0n });
      },
    },
    setMaxAllianceCount: {
      params: [{ name: "value", type: "number" }],
      function: async (value: number) => {
        await setComponentValue(mud, mud.components.P_AllianceConfig, singletonEntity, {
          maxAllianceMembers: BigInt(value),
        });
      },
    },
    maxExpansion: {
      params: [],
      function: async () => {
        const selectedRock = mud.components.ActiveRock.get()?.value;
        if (!selectedRock) throw new Error("No asteroid found");
        const maxLevel = mud.components.Asteroid.get(selectedRock)?.maxLevel ?? 8n;
        await setComponentValue(mud, mud.components.Level, selectedRock, {
          value: maxLevel,
        });
      },
    },
    maxMainBaseLevel: {
      params: [],
      function: async () => {
        const selectedRock = mud.components.ActiveRock.get()?.value;
        const mainBase = mud.components.Home.get(selectedRock)?.value as Entity | undefined;
        if (!mainBase) throw new Error("No main base found");
        const maxLevel = mud.components.P_MaxLevel.get(mainBase)?.value ?? 8n;
        await setComponentValue(mud, mud.components.Level, mainBase, {
          value: maxLevel,
        });
      },
    },
    setTerrain: {
      params: [
        { name: "resource", type: "string" },
        { name: "x", type: "number" },
        { name: "y", type: "number" },
      ],
      function: async (resource: string, x: number, y: number) => {
        const selectedRock = mud.components.ActiveRock.get()?.value;
        const resourceEntity = resources[resource.toLowerCase()];
        const mapId = components.Asteroid.get(selectedRock)?.mapId ?? 1;

        if (!resourceEntity || !selectedRock) throw new Error("Resource not found");

        await setComponentValue(
          mud,
          mud.components.P_Terrain,
          encodeEntity(components.P_Terrain.metadata.keySchema, { mapId, x, y }),
          {
            value: ResourceEnumLookup[resourceEntity],
          }
        );
      },
    },
    createFleet: {
      params: [],
      function: async () => {
        const asteroid = mud.components.ActiveRock.get()?.value;
        if (!asteroid) throw new Error("No asteroid found");
        provideResource(asteroid, EntityType.FleetCount, 1n);
        provideUnit(asteroid, EntityType.MinutemanMarine, 10n);
        createFleet(mud, asteroid, new Map([[EntityType.MinutemanMarine, 10n]]));
      },
    },
    giveFleetResource: {
      params: [
        { name: "resource", type: "string" },
        { name: "count", type: "number" },
      ],
      function: async (resource: string, count: number) => {
        const player = mud.playerAccount.entity;
        if (!player) throw new Error("No player found");
        const selectedFleet = mud.components.SelectedFleet.get()?.value;

        const resourceEntity = resources[resource.toLowerCase()];

        if (!resourceEntity || !selectedFleet) throw new Error("Resource not found");

        const value = BigInt(count * Number(RESOURCE_SCALE));

        await setComponentValue(
          mud,
          mud.components.ResourceCount,
          encodeEntity(
            { entity: "bytes32", resource: "uint8" },
            { entity: selectedFleet as Hex, resource: ResourceEnumLookup[resourceEntity] }
          ),
          {
            value,
          }
        );
      },
    },
    giveAsteroidResource: {
      params: [
        { name: "resource", type: "string" },
        { name: "count", type: "number" },
      ],
      function: async (resource: string, count: number) => {
        const player = mud.playerAccount.entity;
        if (!player) throw new Error("No player found");
        const selectedRock = mud.components.ActiveRock.get()?.value;

        const resourceEntity = resources[resource.toLowerCase()];

        if (!resourceEntity || !selectedRock) throw new Error("Resource not found");

        const value = BigInt(count * Number(RESOURCE_SCALE));
        await setComponentValue(
          mud,
          mud.components.ResourceCount,
          encodeEntity(
            { entity: "bytes32", resource: "uint8" },
            { entity: selectedRock as Hex, resource: ResourceEnumLookup[resourceEntity] }
          ),
          {
            value,
          }
        );
      },
    },
    conquerAsteroid: {
      params: [],
      function: async () => {
        const selectedRock = mud.components.ActiveRock.get()?.value;
        if (!selectedRock) throw new Error("No asteroid found");
        const staticData = components.Asteroid.get(selectedRock)?.__staticData;
        if (staticData === "") {
          toast.error("Asteroid not initialized");
          throw new Error("Asteroid not initialized");
        }
        const player = mud.playerAccount.entity;
        await setComponentValue(mud, components.OwnedBy, selectedRock, { value: player });
        const position = components.Position.get(toHex32("MainBase") as Entity);
        if (!position) throw new Error("No main base found");
        await buildBuilding(mud, EBuilding.MainBase, position);
      },
    },
    getMaxResource: {
      params: [
        { name: "resource", type: "string" },
        { name: "count", type: "number" },
      ],
      function: async (resource: string, count: number) => {
        const player = mud.playerAccount.entity;
        if (!player) throw new Error("No player found");

        const selectedRock = mud.components.ActiveRock.get()?.value;
        const resourceEntity = resources[resource.toLowerCase()];

        if (!resourceEntity || !selectedRock) throw new Error("Resource not found");

        const value = BigInt(count * Number(RESOURCE_SCALE));

        await setComponentValue(
          mud,
          mud.components.MaxResourceCount,
          encodeEntity(
            { entity: "bytes32", resource: "uint8" },
            { entity: selectedRock as Hex, resource: ResourceEnumLookup[resourceEntity] }
          ),
          {
            value,
          }
        );
      },
    },
    getUnits: {
      params: [
        { name: "unit", type: "string" },
        { name: "count", type: "number" },
      ],
      function: async (unit: string, count: number) => {
        const unitEntity = units[unit.toLowerCase().replace(/\s+/g, "")];

        if (!unitEntity) throw new Error("Unit not found");

        const rock = mud.components.ActiveRock.get()?.value;
        if (!rock) throw new Error("No asteroid found");
        provideUnit(rock, unitEntity, BigInt(count));
      },
    },
    getTesterPack: {
      params: [],
      function: async () => {
        const player = mud.playerAccount.entity;
        if (!player) throw new Error("No player found");
        for (const resource of [...ResourceStorages]) {
          await setComponentValue(
            mud,
            mud.components.MaxResourceCount,
            encodeEntity(
              { entity: "bytes32", resource: "uint8" },
              { entity: player as Hex, resource: ResourceEnumLookup[resource] }
            ),
            {
              value: 10000000n,
            }
          );
        }
        for (const resource of [...ResourceStorages]) {
          await setComponentValue(
            mud,
            mud.components.ResourceCount,
            encodeEntity(
              { entity: "bytes32", resource: "uint8" },
              { entity: player as Hex, resource: ResourceEnumLookup[resource] }
            ),
            {
              value: 10000000n,
            }
          );
        }
        UtilityStorages.forEach(async (resource) => {
          if (resource == EntityType.VesselCapacity) return;
          if (!player) {
            toast.error("No player found");
            throw new Error("No player found");
          }

          await setComponentValue(
            mud,
            mud.components.MaxResourceCount,
            encodeEntity(
              { entity: "bytes32", resource: "uint8" },
              { entity: player as Hex, resource: ResourceEnumLookup[resource] }
            ),
            {
              value: 10000000n,
            }
          );
        });
        UtilityStorages.forEach(async (resource) => {
          if (resource == EntityType.VesselCapacity) return;
          if (!player) throw new Error("No player found");

          await setComponentValue(
            mud,
            mud.components.ResourceCount,
            encodeEntity(
              { entity: "bytes32", resource: "uint8" },
              { entity: player as Hex, resource: ResourceEnumLookup[resource] }
            ),
            {
              value: 10000000n,
            }
          );
        });
      },
    },
    spawnPlayers: {
      params: [{ name: "count", type: "number" }],
      function: async (count: number) => {
        const networkConfig = getNetworkConfig();
        const clientOptions = {
          chain: networkConfig.chain,
          transport: transportObserver(fallback([webSocket(), http()])),
          pollingInterval: 1000,
        };

        for (let i = 0; i < count; i++) {
          const privateKey = generatePrivateKey();
          const burnerAccount = createBurnerAccount(privateKey as Hex);

          const burnerWalletClient = createWalletClient({
            ...clientOptions,
            account: burnerAccount,
          });

          const worldContract = getContract({
            address: networkConfig.worldAddress as Hex,
            abi: IWorldAbi,
            publicClient: mud.network.publicClient,
            walletClient: burnerWalletClient,
          });

          await worldContract.write.spawn();
        }
      },
    },
    setFleetCooldown: {
      params: [{ name: "value", type: "number" }],
      function: async (value: number) => {
        const timestamp = (components.Time.get()?.value ?? 0n) + BigInt(value);
        await setComponentValue(
          mud,
          mud.components.CooldownEnd,
          components.SelectedFleet.get()?.value ?? singletonEntity,
          {
            value: BigInt(timestamp),
          }
        );
      },
    },
    removeCooldown: {
      params: [],
      function: async () => {
        await removeComponent(mud, components.CooldownEnd, components.SelectedFleet.get()?.value ?? singletonEntity);
      },
    },
    createPirateAsteroid: {
      params: [],
      function: async () => {
        const playerEntity = mud.playerAccount.entity;
        const asteroid = components.ActiveRock.get()?.value;
        const ownerEntity = hashKeyEntity(PIRATE_KEY, playerEntity);
        const asteroidEntity = hashEntities(ownerEntity);
        const homePromise = setComponentValue(mud, components.Home, ownerEntity, { value: asteroidEntity as Hex });
        const position = components.Position.get(asteroid);
        const coord = { x: (position?.x ?? 0) + 10, y: (position?.y ?? 0) + 10, parent: encodeBytes32("0") };

        await setComponentValue(mud, components.PirateAsteroid, asteroidEntity, {
          isDefeated: false,
          isPirateAsteroid: true,
          prototype: encodeBytes32("0"),
          playerEntity: playerEntity,
        });

        const positionPromise = setComponentValue(mud, components.Position, asteroidEntity, coord);
        const asteroidPromise = setComponentValue(mud, components.Asteroid, asteroidEntity, { isAsteroid: true });

        const reversePosEntity = encodeEntity(mud.components.ReversePosition.metadata.keySchema, {
          x: coord.x,
          y: coord.y,
        });
        const reversePositionPromise = setComponentValue(mud, components.ReversePosition, reversePosEntity, {
          entity: asteroidEntity as Hex,
        });
        const ownedByPromise = setComponentValue(mud, components.OwnedBy, asteroidEntity, { value: ownerEntity });

        await Promise.all([homePromise, positionPromise, reversePositionPromise, asteroidPromise, ownedByPromise]);

        await setComponentValue(mud, components.PirateAsteroid, asteroidEntity, {
          isDefeated: false,
        });
      },
    },
    setActiveAsteroid: {
      params: [{ name: "entity", type: "string" }],
      function: (entity: Entity) => {
        components.ActiveRock.set({ value: entity });
      },
    },
  };
};
