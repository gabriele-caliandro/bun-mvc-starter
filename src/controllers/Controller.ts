import roboticCellPallet1 from "@/api/v1/robotic-cell/[id]/pallet/1";
import roboticCellPallet2 from "@/api/v1/robotic-cell/[id]/pallet/2";
import roboticCellState from "@/api/v1/robotic-cell/[id]/state";
import type { OpcuaConnectionManager } from "@/controller/OpcuaConnectionManager";
import type { Model } from "@/models/Model";
import type { ServerHttp } from "@/network/http/ServerHttp";
import { MonitoringService, type MonitoringServiceI } from "@/services/MonitoringService";
import { LoggerManager } from "@/utils/logger/LoggerManager";

const logger = await LoggerManager.createLogger({ service: "controller" });
export class Controller {
	private model: Model;
	private http: ServerHttp;
	private opcuaConnectionManager: OpcuaConnectionManager;
	private monitoringService: MonitoringServiceI;

	constructor(opcuaConnectionManager: OpcuaConnectionManager, model: Model, http: ServerHttp) {
		this.model = model;
		this.http = http;
		this.opcuaConnectionManager = opcuaConnectionManager;
		this.monitoringService = new MonitoringService(model, opcuaConnectionManager);
	}

	/**
	 * Initializes the controller by connecting to the OPC UA servers.
	 * Exception handling is left to the caller as this method is mandatory for the controller to run.
	 */
	async init() {
		logger.info("Initializing controller...");

		logger.info("Initializing OPC UA connections...");
		await this.opcuaConnectionManager.connectAll();

		logger.info("Initializing monitoring service...");
		await this.monitoringService.startMonitoring();

		this.setupHttpRoutes();
	}

	async run() {
		logger.info("Starting controller...");
		this.monitoringService.initEventConsumer();

		this.http.listen();
	}

	private setupHttpRoutes() {
		logger.info("Setupping routes for http server");

		// Health check endpoint
		this.http.app.get("/health", () => ({ status: "ok" }));

		// Group model-related endpoints under /api
		this.http.app.group(this.http.prefix, (app) =>
			app.use(roboticCellState(this.model)).use(roboticCellPallet1(this.model)).use(roboticCellPallet2(this.model))
		);
	}
}
