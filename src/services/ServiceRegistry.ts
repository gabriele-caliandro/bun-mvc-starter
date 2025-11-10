import type { DatabaseManager } from "@/database/DatabaseManager";
import type { UserManagerI } from "@/interfaces/user-manager/UserManagerI";
import type { BaseMqttClientI } from "@/network/mqtt/BaseMqttClientI";

export type ServiceRegistry = {
  db: DatabaseManager;
  userManger: UserManagerI;
  mqtt: BaseMqttClientI;
};
