import type { QoS } from "@/network/mqtt/BaseMqttClient";
import type { ClientSubscribeCallback } from "mqtt";

export interface BaseMqttClientI {
  readonly brokerUrl: string;
  readonly clientId: string;
  readonly serviceName: string;

  connect(): Promise<void>;
  disconnect(): Promise<void>;
  publish<T>(topic: string, payload: T, qos?: QoS): Promise<void>;

  subscribe(topic: string, callback?: ClientSubscribeCallback, opts?: { qos: QoS }): Promise<void>;
  unsubscribe(topic: string): Promise<void>;
  onMessage<T>(topic: string, handler: (payload: T, topic: string) => Promise<void>): void;
  isConnected(): boolean;
}
