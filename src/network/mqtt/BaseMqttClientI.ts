// src/network/mqtt/BaseMqttClientI.ts
import type { ClientSubscribeCallback, PacketCallback } from "mqtt";
import type { QoS } from "./BaseMqttClient";

/**
 * Interface for MQTT client with type-safe topic and message handling
 */
export interface BaseMqttClientI<T extends Record<string, unknown> = Record<string, unknown>> {
  /**
   * Connection state - true if connected to broker
   */
  readonly isConnected: boolean;

  /**
   * Establish connection to MQTT broker
   * @throws Error if connection fails after max retry attempts
   */
  connect(): Promise<void>;

  /**
   * Close connection to MQTT broker and cleanup resources
   */
  disconnect(): Promise<void>;

  /**
   * Publish a message to a topic
   * @param topic - Topic to publish to (type-safe from T)
   * @param message - Message payload (type-safe based on topic)
   * @param opts - Publishing options (QoS level)
   * @throws Error if not connected
   */
  publish<K extends keyof T>(topic: K, message: T[K], opts?: { qos: QoS }): Promise<void>;

  /**
   * Subscribe to a topic to receive messages
   * @param topic - Topic to subscribe to (type-safe from T)
   * @param callback - Optional callback when subscription is granted
   * @param opts - Subscription options (QoS level)
   * @throws Error if not connected
   */ subscribe(topic: keyof T, opts?: { qos: QoS }, callback?: ClientSubscribeCallback): void;

  /**
   * Unsubscribe from a topic
   * @param topic - Topic to unsubscribe from
   * @param callback - Optional callback when unsubscription is confirmed
   * @throws Error if not connected
   */
  unsubscribe(topic: string, callback?: PacketCallback): Promise<void>;

  /**
   * Register a message handler for a topic
   * Auto-subscribes to topic if not already subscribed
   * @param topic - Topic to handle messages for (type-safe from T)
   * @param handler - Function to handle incoming messages (type-safe based on topic)
   */
  on_message<K extends keyof T>(topic: K, handler: (message: T[K]) => void): void;
}
