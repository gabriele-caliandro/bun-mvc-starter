import { BaseMqttClient } from "@/network/mqtt/BaseMqttClient";

type TopicMap = {
  "sensors/temperature": { value: number };
  "devices/status": { deviceId: string };
  "alerts/critical": { message: string };
};
const mqttClient = new BaseMqttClient<TopicMap>("test-id", "mqtt://localhost:1883");
await mqttClient.connect();


setInterval(() => {
  mqttClient.publish("alerts/critical", { message: "Critical alert!" }, { qos: 2 });
}, 5000);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
