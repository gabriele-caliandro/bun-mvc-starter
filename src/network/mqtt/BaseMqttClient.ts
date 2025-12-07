import type { BaseMqttClientI } from "@/network/mqtt/BaseMqttClientI";
import { base_logger } from "@/utils/logger/logger";
import mqtt, { type ISubscriptionGrant, type MqttClient, type PacketCallback } from "mqtt";

export type QoS = 0 | 1 | 2;

export class BaseMqttClient<T extends Record<string, unknown> = Record<string, unknown>> implements BaseMqttClientI<T> {
  private logger = base_logger.child({ name: "mqtt" });
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
          this.logger.info("Connected to MQTT broker");
          resolve();
        });

        this.client.on("error", (error) => {
          this.logger.error(error, "MQTT error:");
          this.logger.warn(`Retring to connect to MQTT broker in ${this.reconnectPeriod}ms`);
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.logger.error(`Max reconnection attempts (${this.maxReconnectAttempts}) reached`);
            this.client?.end(true);
            reject(error); // Fail fast on connection errors
          }
        });

        // Handle reconnection attempts
        this.client.on("reconnect", () => {
          this.reconnectAttempts++;
          this.logger.info(`Reconnected to MQTT broker (attempt ${this.reconnectAttempts} / ${this.maxReconnectAttempts})`);
        });

        this.client.on("close", () => {
          this.logger.warn("MQTT connection closed");
        });

        this.client.on("offline", () => {
          this.logger.warn("MQTT client offline");
        });

        this.client.on("message", (topic, payload) => {
          const content = JSON.parse(payload.toString());
          this.logger.info({ payload: content }, `Topic "${topic}":`);
          this.handleMessage(topic, payload.toString());
        });
      } catch (error) {
        this.logger.error(error, "Failed to connect to MQTT broker:");
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
          this.logger.error(error, `Error in message handler for topic ${topic}:`);
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
        this.logger.info(`Subscribed to topic "${grantedQos?.topic}" with QoS ${grantedQos?.qos}`);
        this.messageHandlers.set(topic, []);

        callback?.(granted);
      })
      .catch((err) => {
        this.logger.error({ error: err }, `Error subscribing to topic ${topic.toString()}`);
      });
  }

  public onMessage<K extends keyof T>(topic: K, handler: (message: T[K]) => void): void {
    if (!this.messageHandlers.has(topic)) {
      this.logger.warn(`Client not subscribed to topic '${topic.toString()}' yet. Autosubscribing topic '${topic.toString()}'`);
      this.messageHandlers.set(topic, []);
      this.subscribe(topic.toString());
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.messageHandlers.get(topic)!.push(handler as any);
    this.logger.info(`Added consumer for topic '${topic.toString()}'`);
  }

  async unsubscribe(topic: string, callback?: PacketCallback): Promise<void> {
    if (!this.client) throw new Error("Not connected");
    this.client.unsubscribe(topic, (err, packet) => {
      this.logger.info(`Unsubscribed from topic "${topic}"`);
      if (err) {
        this.logger.error(err, `Error unsubscribing from topic "${topic}"`);
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
