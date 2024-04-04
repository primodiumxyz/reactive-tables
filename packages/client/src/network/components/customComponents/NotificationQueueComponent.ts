import { Entity, Type } from "@latticexyz/recs";
import { world } from "src/network/world";
import { createExtendedComponent } from "./ExtendedComponent";

export type NotificationType = "battle" | "arrival-transit" | "arrival-orbit";
export type Notification = {
  id: string;
  entity: Entity;
  timestamp: number;
  type: NotificationType;
};

export const NotificationQueueComponent = () => {
  const component = createExtendedComponent(
    world,
    {
      ids: Type.StringArray,
      entities: Type.EntityArray,
      timestamp: Type.NumberArray,
      type: Type.StringArray,
    },
    {
      id: "NotificationQueue",
      metadata: { contractId: `component.NotificationQueue` },
    }
  );

  const addNotification = (notification: Notification) => {
    const currentData = component.get() || {
      ids: new Array<string>(),
      entities: new Array<Entity>(),
      timestamp: new Array<number>(),
      type: new Array<NotificationType>(),
    };
    currentData.ids.push(notification.id);
    currentData.entities.push(notification.entity);
    currentData.timestamp.push(notification.timestamp);
    currentData.type.push(notification.type);
    component.set(currentData);
  };

  const removeNotification = (id: string) => {
    const currentData = component.get() || {
      ids: [],
      entities: [],
      timestamp: [],
      type: [],
    };
    const index = currentData.ids.indexOf(id);
    if (index !== -1) {
      currentData.ids.splice(index, 1);
      currentData.entities.splice(index, 1);
      currentData.timestamp.splice(index, 1);
      currentData.type.splice(index, 1);
    }
    component.set(currentData);
  };

  return {
    ...component,
    addNotification,
    removeNotification,
  };
};
