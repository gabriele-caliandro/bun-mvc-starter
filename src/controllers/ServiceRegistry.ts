import type { DatabaseManager } from "@/database/DatabaseManager";
import type { BaseMqttClientI } from "@/network/mqtt/BaseMqttClientI";
import type { AuthService } from "@/services/AuthService";

export type ServiceRegistry = {
  db: DatabaseManager;
  mqtt: BaseMqttClientI;
  auth_service: AuthService;
  /* other services */
};
