import type { BaseMqttClientI } from "@/network/mqtt/BaseMqttClientI";
import { LoggerManager } from "@/utils/logger/LoggerManager";
import mqtt, { type ISubscriptionGrant, type MqttClient, type PacketCallback } from "mqtt";

export type QoS = 0 | 1 | 2;
const logger = await LoggerManager.createLogger({ service: "mqtt" });

export class BaseMqttClient<T extends Record<string, unknown> = Record<string, unknown>> implements BaseMqttClientI<T> {
  private client: MqttClient | null = null;

  private reconnectAttempts = 0;
  private reconnectPeriod = 3000;
  private maxReconnectAttempts = 2;

  private messageHandlers = new Map<keyof T, Array<(message: T[keyof T]) => void>>();

  constructor(
    private clientId: string,
    private brokerUrl: string
  ) {}

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.client = mqtt.connect(this.brokerUrl, {
          reconnectPeriod: this.reconnectPeriod,
          connectTimeout: 60_000,
          clientId: this.clientId,
        });

        // Wait for actual connection before resolving
        this.client.on("connect", () => {
          this.reconnectAttempts = 0;
          logger.info("Connected to MQTT broker");
          resolve();
        });

        this.client.on("error", (error) => {
          logger.error("MQTT error:", error);
          logger.warn(`Retring to connect to MQTT broker in ${this.reconnectPeriod}ms`);
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            logger.error(`Max reconnection attempts (${this.maxReconnectAttempts}) reached`);
            this.client?.end(true);
            reject(error); // Fail fast on connection errors
          }
        });

        // Handle reconnection attempts
        this.client.on("reconnect", () => {
          this.reconnectAttempts++;
          logger.info(`Reconnected to MQTT broker (attempt ${this.reconnectAttempts} / ${this.maxReconnectAttempts})`);
        });

        this.client.on("close", () => {
          logger.warn("MQTT connection closed");
        });

        this.client.on("offline", () => {
          logger.warn("MQTT client offline");
        });

        this.client.on("message", (topic, payload) => {
          const content = JSON.parse(payload.toString());
          logger.info(`Topic "${topic}":`, { payload: content });
          this.handleMessage(topic, payload.toString());
        });
      } catch (error) {
        logger.error("Failed to connect to MQTT broker:", error);
      }
    });
  }

  private handleMessage(topic: string, message: string): void {
    const handlers = this.messageHandlers.get(topic as keyof T);
    if (handlers) {
      let parsedMessage: T[keyof T];
      try {
        parsedMessage = JSON.parse(message);
      } catch {
        parsedMessage = message as T[keyof T]; // Fallback to string
      }
      handlers.forEach((handler) => {
        try {
          handler(parsedMessage);
        } catch (error) {
          logger.error(`Error in message handler for topic ${topic}:`, error);
        }
      });
    }
  }

  async publish<K extends keyof T>(topic: K, message: T[K], opts: { qos: QoS } = { qos: 0 }): Promise<void> {
    if (!this.client) throw new Error("Not connected");

    this.client.publish(topic.toString(), JSON.stringify(message), { qos: opts.qos });
  }

  async subscribe(topic: keyof T, callback?: (granted: ISubscriptionGrant[]) => void, opts: { qos: QoS } = { qos: 0 }): Promise<void> {
    if (!this.client) throw new Error("Not connected");

    await this.client
      .subscribeAsync(topic.toString(), { qos: opts.qos })
      .then((granted) => {
        const grantedQos = granted?.at(0);
        logger.info(`Subscribed to topic "${grantedQos?.topic}" with QoS ${grantedQos?.qos}`);
        this.messageHandlers.set(topic, []);

        callback?.(granted);
      })
      .catch((err) => {
        logger.error(`Error subscribing to topic ${topic.toString()}`, { error: err });
      });
  }

  public onMessage<K extends keyof T>(topic: K, handler: (message: T[K]) => void): void {
    if (!this.messageHandlers.has(topic)) {
      logger.warn(`Client not subscribed to topic '${topic.toString()}' yet. Autosubscribing topic '${topic.toString()}'`);
      this.messageHandlers.set(topic, []);
      this.subscribe(topic.toString());
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.messageHandlers.get(topic)!.push(handler as any);
    logger.info(`Added consumer for topic '${topic.toString()}'`);
  }

  async unsubscribe(topic: string, callback?: PacketCallback): Promise<void> {
    if (!this.client) throw new Error("Not connected");
    this.client.unsubscribe(topic, (err, packet) => {
      logger.info(`Unsubscribed from topic "${topic}"`);
      if (err) {
        logger.error(`Error unsubscribing from topic "${topic}"`, { err });
      }
      callback?.(err, packet);
    });
  }

  async disconnect(): Promise<void> {
    this.messageHandlers.clear();
    this.client?.end();
  }

  get isConnected(): boolean {
    return this.client?.connected ?? false;
  }
}
