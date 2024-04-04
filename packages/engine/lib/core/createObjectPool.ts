import { mapObject, uuid } from "@latticexyz/utils";
import { observable } from "mobx";
import { GameObjectClasses } from "../../constants";
import { EmbodiedEntity, GameObjectTypes } from "../../types";
import { createEmbodiedEntity } from "./createEmbodiedEntity";

type ObjectPoolReturnType<Type> = Type extends keyof GameObjectTypes
  ? EmbodiedEntity<Type>
  : EmbodiedEntity<keyof GameObjectTypes> | undefined;

function isGameObjectType(t: string): t is keyof GameObjectTypes {
  return Object.keys(GameObjectClasses).includes(t);
}

export function createObjectPool(scene: Phaser.Scene) {
  const groups = mapObject(GameObjectClasses, (classType) => {
    if (classType === GameObjectClasses.BitmapText) {
      return scene.add.group({ classType, defaultKey: "teletactile" });
    }
    return scene.add.group({ classType });
  }) as {
    [key in keyof typeof GameObjectClasses]: Phaser.GameObjects.Group;
  };

  const objects = observable(new Map<string, EmbodiedEntity<keyof GameObjectTypes>>());

  const embodiedGroups = new Map<string, Set<EmbodiedEntity<keyof GameObjectTypes>>>();

  const cameraFilter = { current: 0 };

  function get<Type extends keyof GameObjectTypes | "Existing">(
    entity: number | string,
    type: Type,
    ignoreCulling = false
  ): ObjectPoolReturnType<typeof type> {
    if (typeof entity === "number") entity = String(entity);
    let embodiedEntity = objects.get(entity);
    if (!isGameObjectType(type)) {
      if (!embodiedEntity) return undefined as ObjectPoolReturnType<typeof type>;
      return embodiedEntity as ObjectPoolReturnType<typeof type>;
    }

    // If the entity doesn't exist yet, we create a new one and track its chunk
    if (!embodiedEntity) {
      embodiedEntity = createEmbodiedEntity<typeof type>(
        entity,
        groups[type],
        type,
        ignoreCulling,
        cameraFilter.current
      );
    }

    if (!objects.has(entity)) {
      objects.set(entity, embodiedEntity);
    }

    return embodiedEntity as ObjectPoolReturnType<typeof type>;
  }

  //use a single id to manage multiple embodied entities ea
  function getGroup(id: string) {
    let group = embodiedGroups.get(id);

    if (!group) {
      group = new Set();
      embodiedGroups.set(id, group);
    }

    function add<Type extends keyof GameObjectTypes | "Existing">(type: Type, id?: string, ignoreCulling = false) {
      const entityID = id ?? uuid();
      const entity = get(entityID, type, ignoreCulling) as ObjectPoolReturnType<Type>;

      if (!group || !entity) throw Error("Group or entity was not found.");

      group.add(entity);

      return entity;
    }

    return {
      objects: group,
      get,
      add,
    };
  }

  function remove(entity: number | string) {
    if (typeof entity === "number") entity = String(entity);
    const object = objects.get(entity);
    if (object) object.despawn(true);
    objects.delete(entity);
  }

  function removeGroup(id: string) {
    const group = embodiedGroups.get(id);

    if (!group) return;

    for (const entity of group) {
      remove(entity.id);
    }

    embodiedGroups.delete(id);
  }

  function ignoreCamera(cameraId: number, ignore: boolean) {
    if (ignore) {
      cameraFilter.current |= cameraId;
    } else {
      cameraFilter.current &= ~cameraId;
    }

    for (const embodiedEntity of objects.values()) {
      embodiedEntity.setCameraFilter(cameraFilter.current);
    }
  }

  return { get, remove, objects, groups, ignoreCamera, getGroup, removeGroup };
}
