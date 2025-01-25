import { EventEmitter } from "expo-modules-core";

type QueueEvents = {
  queueUpdated: () => void;
};

export const queueEventEmitter = new EventEmitter<QueueEvents>();

export const QueueEvents = {
  UPDATED: "queueUpdated" as const,
};
