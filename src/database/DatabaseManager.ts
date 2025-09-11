import { drizzle } from "drizzle-orm/postgres-js";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { LoggerManager } from "@/utils/logger/LoggerManager";
import { sql } from "drizzle-orm";

const logger = await LoggerManager.get_logger({ service: "database" });

/**
 * DatabaseManager - A singleton class to manage database connections
 * Implements dependency injection pattern for Drizzle ORM
 */
export class DatabaseManager {
  public readonly host: string;
  public readonly port: number;
  public readonly database: string;
  public readonly username: string;
  public readonly password: string;

  private _drizzle: PostgresJsDatabase<Record<string, never>> | null = null;
  private _queryClient: postgres.Sql | null = null;

  private maxRetries: number;
  private retryDelay: number;

  /**
   * Private constructor to prevent direct instantiation
   * @param connectionUrl - PostgreSQL connection URL
   * @param maxRetries - Maximum number of connection retry attempts
   * @param retryDelay - Delay between retry attempts in milliseconds
   */
  public constructor(
    host: string,
    port: number = 5432,
    database: string,
    username: string,
    password: string,
    maxRetries = 5,
    retryDelay = 5000
  ) {
    const connectionUrl = `postgres://${username}@${host}:${port}/${database}`;
    this.host = host;
    this.port = port;
    this.database = database;
    this.username = username;
    this.password = password;
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
    logger.info(`DatabaseManager instance created for database '${connectionUrl}' `);
  }

  /**
   * Initialize the database connection with retry mechanism
   * @returns Promise resolving to the drizzle DB instance
   */
  public async init(): Promise<PostgresJsDatabase<Record<string, never>>> {
    if (this._drizzle) {
      logger.info("Database connection already initialized");
      return this._drizzle;
    }

    let retries = 0;
    let lastError: Error | null = null;

    while (retries <= this.maxRetries) {
      try {
        logger.info(`Attempting to connect to database (attempt ${retries + 1}/${this.maxRetries + 1})`);

        // Close any previous connection if it exists
        if (this._queryClient) {
          await this._queryClient.end();
          this._queryClient = null;
        }

        // Initialize postgres client
        this._queryClient = postgres("", {
          host: this.host,
          port: this.port,
          database: this.database,
          user: this.username,
          password: this.password,
        });

        // Initialize drizzle with the postgres client
        this._drizzle = drizzle(this._queryClient);

        // Test the connection
        const testResult = await this._drizzle.execute(sql`SELECT 1 as test`);
        logger.info("Database connection successful", { testResult });

        return this._drizzle;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.error(`Database connection attempt ${retries + 1} failed: ${lastError.message}`);

        retries++;

        if (retries <= this.maxRetries) {
          logger.info(`Retrying in ${this.retryDelay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
        }
      }
    }

    logger.error(`Failed to connect to database after ${this.maxRetries + 1} attempts`);
    throw lastError || new Error("Failed to connect to database");
  }

  /**
   * Get the drizzle DB instance
   * @returns PostgresJsDatabase instance
   * @throws Error if database is not initialized
   */
  get drizzle(): PostgresJsDatabase<Record<string, never>> {
    if (!this._drizzle) {
      throw new Error("Database not initialized. Call init() first.");
    }
    return this._drizzle;
  }

  /**
   * Close the database connection
   */
  public async close(): Promise<void> {
    logger.info("Closing database connection...");
    if (this._queryClient) {
      logger.info("Closing database connection");
      await this._queryClient.end();
      this._queryClient = null;
      this._drizzle = null;
      logger.info("Database connection closed");
    } else {
      throw new Error("Database not initialized. Call init() first.");
    }
  }
}
