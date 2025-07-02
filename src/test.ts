import { BaseMqttClient } from "@/network/mqtt/BaseMqttClient";

type TopicMap = {
  "sensors/temperature": { value: number };
  "devices/status": { deviceId: string };
  "alerts/critical": { message: string };
};
const mqttClient = new BaseMqttClient<TopicMap>("test-id", "mqtt://localhost:1883");
await mqttClient.connect();

await mqttClient.subscribe("alerts/critical");
await mqttClient.subscribe("devices/status");

mqttClient.onMessage("devices/status", (message) => {
  console.log(`Handler 1 received message:`, message.deviceId);
});
mqttClient.onMessage("alerts/critical", (message) => {
  console.log(`Handler 2 received message:`, message);
});


function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
