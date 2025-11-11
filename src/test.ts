import pino from "pino";

const transport = pino.transport({
  // name: "my-personal-logger",
  target: "pino-pretty",
  options: {
    // destination: "/dev/null",
  },
});
const logger = pino({
  transports: [transport],
});

logger.info("Hello World! This is a test message. I hope you are doing well. If you are not, please contact me.");
logger.info(30);
logger.info(30, "messaggio con numero");
const user = { name: "Gabriel", age: 30 };
logger.info({ user });
const error = new Error("Something went wrong");
logger.info("altro messaggio", error);
logger.error(error);

const child = logger.child({ child: "child", deep: { key: 20 } });
child.warn("quasi error");
child.error("quasi error");
