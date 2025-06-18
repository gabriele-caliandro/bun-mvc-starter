// src/network/mqtt/BaseMqttClient.ts
import type { BaseMqttClientI } from "@/network/mqtt/BaseMqttClientI";
import type { EnhancedLogger } from "@/utils/logger/EnhancedLogger";
import { LoggerManager } from "@/utils/logger/LoggerManager";
import mqtt, { type IClientOptions, type MqttClient } from "mqtt";

export class BaseMqttClient implements BaseMqttClientI {
  public readonly brokerUrl: string;
  public readonly clientId: string;
  public readonly serviceName: string;

  protected logger: EnhancedLogger | null = null;
  private client: MqttClient | null = null;
  private messageHandlers = new Map<string, Array<(payload: unknown, topic: string) => Promise<void>>>();
  private readonly options: IClientOptions;

  constructor(brokerUrl: string, serviceName: string, clientId?: string, options: IClientOptions = {}) {
    this.brokerUrl = brokerUrl;
    this.serviceName = serviceName;
    this.clientId = clientId || `${serviceName}-${crypto.randomUUID()}`;
    this.options = {
      reconnectPeriod: 5000,
      connectTimeout: 30000,
      ...options,
    };
    this.initLogger();
  }

  private async initLogger() {
    this.logger = await LoggerManager.createLogger({ service: this.serviceName });
  }

  async connect(): Promise<void> {
    if (this.client && this.client.connected) {
      this.logger?.debug("Already connected to MQTT broker");
      return;
    }

    return new Promise((resolve, reject) => {
      this.logger?.info(`Connecting to MQTT broker at ${this.brokerUrl}`, {
        clientId: this.clientId,
        options: this.options,
      });

      this.client = mqtt.connect(this.brokerUrl, {
        ...this.options,
        clientId: this.clientId,
      });

      // Connection successful
      this.client.on("connect", () => {
        this.logger?.info("Successfully connected to MQTT broker", {
          brokerUrl: this.brokerUrl,
          clientId: this.clientId,
        });
        resolve();
      });

      // Connection error
      this.client.on("error", (error) => {
        this.logger?.error("MQTT connection error", {
          error: error.message,
          brokerUrl: this.brokerUrl,
        });
        reject(new Error(`MQTT connection failed: ${error.message}`));
      });

      // Connection lost
      this.client.on("offline", () => {
        this.logger?.warn("MQTT connection lost - attempting to reconnect", {
          brokerUrl: this.brokerUrl,
        });
      });

      // Reconnection successful
      this.client.on("reconnect", () => {
        this.logger?.info("MQTT reconnection attempt", {
          brokerUrl: this.brokerUrl,
        });
      });

      // Message received
      this.client.on("message", (topic, payload) => {
        this.handleMessage(topic, payload);
      });
    });
  }

  async disconnect(): Promise<void> {
    if (!this.client) {
      this.logger?.debug("No MQTT client to disconnect");
      return;
    }

    return new Promise((resolve) => {
      this.logger?.info("Disconnecting from MQTT broker");

      this.client!.end(false, {}, () => {
        this.logger?.info("Successfully disconnected from MQTT broker");
        this.client = null;
        this.messageHandlers.clear();
        resolve();
      });
    });
  }

  async publish<T>(topic: string, payload: T, qos: QoS = 0): Promise<void> {
    if (!this.client || !this.client.connected) {
      throw new Error("MQTT client not connected");
    }

    const message = JSON.stringify(payload);

    return new Promise((resolve, reject) => {
      this.logger?.debug(`Publishing MQTT message to topic '${topic}'`, {
        topic,
        payloadSize: message.length,
        qos,
      });

      this.client!.publish(topic, message, { qos }, (error) => {
        if (error) {
          this.logger?.error(`Failed to publish MQTT message to topic '${topic}'`, {
            error: error.message,
            topic,
          });
          reject(new Error(`MQTT publish failed: ${error.message}`));
        } else {
          this.logger?.debug(`Successfully published MQTT message to topic '${topic}'`);
          resolve();
        }
      });
    });
  }

  async subscribe(topic: string, qos: QoS = 0): Promise<void> {
    if (!this.client || !this.client.connected) {
      throw new Error("MQTT client not connected");
    }

    return new Promise((resolve, reject) => {
      this.logger?.info(`Subscribing to MQTT topic '${topic}'`, { topic, qos });

      this.client!.subscribe(topic, { qos }, (error, granted) => {
        if (error) {
          this.logger?.error(`Failed to subscribe to MQTT topic '${topic}'`, {
            error: error.message,
            topic,
          });
          reject(new Error(`MQTT subscribe failed: ${error.message}`));
        } else {
          this.logger?.info(`Successfully subscribed to MQTT topic '${topic}'`, {
            topic,
            granted,
          });
          resolve();
        }
      });
    });
  }

  async unsubscribe(topic: string): Promise<void> {
    if (!this.client || !this.client.connected) {
      throw new Error("MQTT client not connected");
    }

    return new Promise((resolve, reject) => {
      this.logger?.info(`Unsubscribing from MQTT topic '${topic}'`, { topic });

      this.client!.unsubscribe(topic, {}, (error) => {
        if (error) {
          this.logger?.error(`Failed to unsubscribe from MQTT topic '${topic}'`, {
            error: error.message,
            topic,
          });
          reject(new Error(`MQTT unsubscribe failed: ${error.message}`));
        } else {
          this.logger?.info(`Successfully unsubscribed from MQTT topic '${topic}'`);
          resolve();
        }
      });
    });
  }

  onMessage<T>(topic: string, handler: (payload: T, topic: string) => Promise<void>): void {
    if (!this.messageHandlers.has(topic)) {
      this.messageHandlers.set(topic, []);
    }

    this.messageHandlers.get(topic)!.push(handler as (payload: unknown, topic: string) => Promise<void>);

    this.logger?.debug(`Registered message handler for topic '${topic}'`, {
      topic,
      totalHandlers: this.messageHandlers.get(topic)!.length,
    });
  }

  isConnected(): boolean {
    return this.client?.connected ?? false;
  }

  private async handleMessage(topic: string, payload: Buffer): Promise<void> {
    try {
      const data = JSON.parse(payload.toString());

      this.logger?.debug(`Received MQTT message on topic '${topic}'`, {
        topic,
        payloadSize: payload.length,
      });

      // Find matching handlers (supports wildcards)
      for (const [handlerTopic, handlers] of this.messageHandlers.entries()) {
        if (this.topicMatches(topic, handlerTopic)) {
          for (const handler of handlers) {
            try {
              await handler(data, topic);
            } catch (error) {
              this.logger?.error(`Error in message handler for topic '${topic}'`, {
                error: error instanceof Error ? error.message : String(error),
                topic,
                handlerTopic,
              });
            }
          }
        }
      }
    } catch (error) {
      this.logger?.error(`Failed to parse MQTT message on topic '${topic}'`, {
        error: error instanceof Error ? error.message : String(error),
        topic,
        rawPayload: payload.toString(),
      });
    }
  }

  private topicMatches(actualTopic: string, pattern: string): boolean {
    // Convert MQTT wildcards to regex
    const regexPattern = pattern
      .replace(/\+/g, "[^/]+") // + matches single level
      .replace(/#/g, ".*"); // # matches multiple levels

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(actualTopic);
  }
}
