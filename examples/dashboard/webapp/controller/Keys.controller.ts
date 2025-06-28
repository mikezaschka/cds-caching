import MessageBox from "sap/m/MessageBox";
import BaseController from "./BaseController";
import CacheStatisticsService, { KeyAccess } from "../service/CacheStatisticsService";
import ODataModel from "sap/ui/model/odata/v4/ODataModel";
import JSONModel from "sap/ui/model/json/JSONModel";

/**
 * @namespace cds.plugin.caching.dashboard.controller
 */
export default class Keys extends BaseController {
	private statisticsService: CacheStatisticsService;
	private uiModel: JSONModel;

	public onInit(): void {
		super.onInit();
		
		// Get the OData model from the component
		const odataModel = this.getOwnerComponent().getModel() as ODataModel;
		this.statisticsService = new CacheStatisticsService(odataModel);
		
		// Create a JSON model for UI data binding
		this.uiModel = new JSONModel({
			topKeys: [],
			coldKeys: [],
			loading: false,
			totalKeys: 0,
			mostActiveKey: 'N/A',
			leastActiveKey: 'N/A',
			dataTypeStats: [],
			serviceStats: []
		});
		this.getView().setModel(this.uiModel, "ui");
		
		this.loadKeys();
	}

	/**
	 * Load keys data
	 */
	private async loadKeys(): Promise<void> {
		try {
			this.uiModel.setProperty("/loading", true);
			
			// Get selected cache from app model
			const selectedCache = this.getModel("app").getProperty("/selectedCache");
			if (!selectedCache) {
				MessageBox.warning("No cache selected");
				return;
			}
			
			const [topKeys, coldKeys] = await Promise.all([
				this.statisticsService.getTopKeys(selectedCache),
				this.statisticsService.getColdKeys(selectedCache)
			]);
			
			// Calculate key statistics
			const allKeys = [...topKeys, ...coldKeys];
			const uniqueKeys = new Map();
			allKeys.forEach(key => {
				if (!uniqueKeys.has(key.keyName)) {
					uniqueKeys.set(key.keyName, key);
				}
			});
			
			const totalKeys = uniqueKeys.size;
			const mostActiveKey = topKeys.length > 0 ? topKeys[0].keyName : 'N/A';
			const leastActiveKey = coldKeys.length > 0 ? coldKeys[0].keyName : 'N/A';
			
			// Analyze metadata
			const dataTypeStats = this.analyzeDataTypeDistribution(allKeys);
			const serviceStats = this.analyzeServiceDistribution(allKeys);
			
			this.uiModel.setProperty("/topKeys", topKeys);
			this.uiModel.setProperty("/coldKeys", coldKeys);
			this.uiModel.setProperty("/totalKeys", totalKeys);
			this.uiModel.setProperty("/mostActiveKey", mostActiveKey);
			this.uiModel.setProperty("/leastActiveKey", leastActiveKey);
			this.uiModel.setProperty("/dataTypeStats", dataTypeStats);
			this.uiModel.setProperty("/serviceStats", serviceStats);
		} catch (error) {
			console.error("Error loading keys:", error);
			MessageBox.error("Failed to load keys data");
		} finally {
			this.uiModel.setProperty("/loading", false);
		}
	}

	/**
	 * Analyze data type distribution
	 */
	private analyzeDataTypeDistribution(keys: KeyAccess[]): any[] {
		const distribution = new Map<string, number>();
		keys.forEach(key => {
			const dataType = key.dataType || 'custom';
			distribution.set(dataType, (distribution.get(dataType) || 0) + 1);
		});
		
		return Array.from(distribution.entries()).map(([type, count]) => ({
			type,
			count,
			percentage: ((count / keys.length) * 100).toFixed(1)
		}));
	}

	/**
	 * Analyze service distribution
	 */
	private analyzeServiceDistribution(keys: KeyAccess[]): any[] {
		const distribution = new Map<string, number>();
		keys.forEach(key => {
			const service = key.serviceName || 'unknown';
			distribution.set(service, (distribution.get(service) || 0) + 1);
		});
		
		return Array.from(distribution.entries())
			.map(([service, count]) => ({
				service,
				count,
				percentage: ((count / keys.length) * 100).toFixed(1)
			}))
			.sort((a, b) => b.count - a.count)
			.slice(0, 10); // Top 10 services
	}

	/**
	 * Handle refresh
	 */
	public onRefresh(): void {
		this.loadKeys();
		MessageBox.success("Keys data refreshed successfully");
	}

	/**
	 * Format last access time
	 */
	public formatLastAccess(timestamp: string): string {
		if (!timestamp) return "Never";
		const date = new Date(timestamp);
		return date.toLocaleString();
	}

	/**
	 * Format total operations
	 */
	public formatTotalOperations(total: number): string {
		return total.toLocaleString();
	}

	/**
	 * Handle cache change
	 */
	public onCacheChange(): void {
		this.loadKeys();
	}

	/**
	 * Navigate back to main page
	 */
	public onNavBack(): void {
		this.getRouter().navTo("main");
	}
} 