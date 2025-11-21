import { get_error_message } from "@/utils/get-error-message";
import { logger } from "@/utils/logger/logger";
import { MongoClient } from "mongodb";

export class MongoConnection {
  private logger = logger.child({ service: "mongo-database-connection" });
  public readonly client: MongoClient;
  private url: string;
  private db_name: string | null = null;

  constructor(url: string) {
    this.url = url;
    this.client = new MongoClient(url);

    this.init_listeners();
  }

  private init_listeners() {
    this.client.on("open", () => {
      this.logger.info(`Mongo client connected to ${this.url} `);
    });
    this.client.on("close", () => {
      this.logger.info(`Mongo client disconnected from ${this.url} `);
    });
    this.client.on("error", (err) => {
      this.logger.error(`Mongo client error: ${get_error_message(err)}`);
    });
  }

  async connect(db_name: string) {
    this.logger.info(`Connecting to Mongo DB '${db_name}' at ...`);
    await this.client.connect();
    this.db_name = db_name;
  }

  get db() {
    if (this.db_name === null) {
      this.logger.error("Mongo client is not connected. Call connect() first");
      throw new Error("Mongo client is not connected. Call connect() first");
    }
    return this.client.db(this.db_name);
  }
}
