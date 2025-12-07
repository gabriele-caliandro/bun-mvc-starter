import type { DatabaseManager } from "@/database/DatabaseManager";
import type { BaseMqttClientI } from "@/network/mqtt/BaseMqttClientI";

export type ServiceRegistry = {
  db: DatabaseManager;
  mqtt: BaseMqttClientI;
  /* other services */
};
