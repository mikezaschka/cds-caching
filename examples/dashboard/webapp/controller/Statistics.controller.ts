import MessageBox from "sap/m/MessageBox";
import BaseController from "./BaseController";
import CacheStatisticsService, { HistoricalStatistics } from "../service/CacheStatisticsService";
import ODataModel from "sap/ui/model/odata/v4/ODataModel";
import JSONModel from "sap/ui/model/json/JSONModel";

/**
 * @namespace cds.plugin.caching.dashboard.controller
 */
export default class Statistics extends BaseController {
	private statisticsService: CacheStatisticsService;
	private uiModel: JSONModel;

	public onInit(): void {
		super.onInit();

		// Get the OData model from the component
		const odataModel = this.getOwnerComponent().getModel() as ODataModel;
		this.statisticsService = new CacheStatisticsService(odataModel);

		// Create a JSON model for UI data binding
		this.uiModel = new JSONModel({
			statistics: [],
			periodFilter: "hourly",
			fromDate: null,
			toDate: null,
			chartMetric: "hitRatio",
			loading: false,
			totalRecords: 0,
			avgHitRatio: 0,
			avgLatency: 0,
			totalRequests: 0,
			avgCacheEfficiency: 0,
			avgHitLatency: 0,
			avgMissLatency: 0,
			avgSetLatency: 0,
			avgDeleteLatency: 0,
			p95HitLatency: 0,
			p99HitLatency: 0,
			p95MissLatency: 0,
			p99MissLatency: 0
		});
		this.getView().setModel(this.uiModel, "ui");

		// Set default date range (last 7 days)
		const now = new Date();
		const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

		this.uiModel.setProperty("/fromDate", sevenDaysAgo);
		this.uiModel.setProperty("/toDate", now);

		this.getRouter().getRoute("statistics").attachPatternMatched(this.onRouteMatched, this);

	}

	public onRouteMatched(): void {
		this.onLoadStatistics();
	}

	/**
	 * Load statistics based on current filters
	 */
	private async loadStatistics(): Promise<void> {
		const cacheName = this.getModel("app").getProperty("/selectedCache");
		if (!cacheName) {
			return;
		}

		try {
			this.uiModel.setProperty("/loading", true);

			const period = this.uiModel.getProperty("/periodFilter");
			const fromDate = this.uiModel.getProperty("/fromDate");
			const toDate = this.uiModel.getProperty("/toDate");

			let from: string | undefined;
			let to: string | undefined;

			if (fromDate) {
				from = fromDate.toISOString();
			}
			if (toDate) {
				to = toDate.toISOString();
			}

			const statistics = await this.statisticsService.getHistoricalStatistics(cacheName, period, from, to);

			this.uiModel.setProperty("/statistics", statistics);
			this.calculateSummary(statistics);

		} catch (error) {
			console.error("Error loading statistics:", error);
			MessageBox.error("Failed to load statistics");
		} finally {
			this.uiModel.setProperty("/loading", false);
		}
	}

	/**
	 * Calculate summary statistics
	 */
	private calculateSummary(statistics: HistoricalStatistics[]): void {
		if (statistics.length === 0) {
			this.uiModel.setProperty("/totalRecords", 0);
			this.uiModel.setProperty("/avgHitRatio", 0);
			this.uiModel.setProperty("/avgLatency", 0);
			this.uiModel.setProperty("/totalRequests", 0);
			this.uiModel.setProperty("/avgCacheEfficiency", 0);
			this.uiModel.setProperty("/avgHitLatency", 0);
			this.uiModel.setProperty("/avgMissLatency", 0);
			this.uiModel.setProperty("/avgSetLatency", 0);
			this.uiModel.setProperty("/avgDeleteLatency", 0);
			this.uiModel.setProperty("/p95HitLatency", 0);
			this.uiModel.setProperty("/p99HitLatency", 0);
			this.uiModel.setProperty("/p95MissLatency", 0);
			this.uiModel.setProperty("/p99MissLatency", 0);
			return;
		}

		const totalRecords = statistics.length;
		const totalRequests = statistics.reduce((sum, stat) => sum + stat.hits + stat.misses, 0);
		const avgHitRatio = statistics.reduce((sum, stat) => sum + stat.hitRatio, 0) / totalRecords;
		const avgLatency = statistics.reduce((sum, stat) => sum + stat.avgLatency, 0) / totalRecords;
		const avgCacheEfficiency = statistics.reduce((sum, stat) => sum + (stat.cacheEfficiency || 0), 0) / totalRecords;
		const avgHitLatency = statistics.reduce((sum, stat) => sum + (stat.avgHitLatency || 0), 0) / totalRecords;
		const avgMissLatency = statistics.reduce((sum, stat) => sum + (stat.avgMissLatency || 0), 0) / totalRecords;
		const avgSetLatency = statistics.reduce((sum, stat) => sum + (stat.avgSetLatency || 0), 0) / totalRecords;
		const avgDeleteLatency = statistics.reduce((sum, stat) => sum + (stat.avgDeleteLatency || 0), 0) / totalRecords;

		// Calculate max P95/P99 values for worst-case analysis
		const p95HitLatency = Math.max(...statistics.map(stat => stat.p95HitLatency || 0));
		const p99HitLatency = Math.max(...statistics.map(stat => stat.p99HitLatency || 0));
		const p95MissLatency = Math.max(...statistics.map(stat => stat.p95MissLatency || 0));
		const p99MissLatency = Math.max(...statistics.map(stat => stat.p99MissLatency || 0));

		this.uiModel.setProperty("/totalRecords", totalRecords);
		this.uiModel.setProperty("/avgHitRatio", avgHitRatio);
		this.uiModel.setProperty("/avgLatency", avgLatency);
		this.uiModel.setProperty("/totalRequests", totalRequests);
		this.uiModel.setProperty("/avgCacheEfficiency", avgCacheEfficiency);
		this.uiModel.setProperty("/avgHitLatency", avgHitLatency);
		this.uiModel.setProperty("/avgMissLatency", avgMissLatency);
		this.uiModel.setProperty("/avgSetLatency", avgSetLatency);
		this.uiModel.setProperty("/avgDeleteLatency", avgDeleteLatency);
		this.uiModel.setProperty("/p95HitLatency", p95HitLatency);
		this.uiModel.setProperty("/p99HitLatency", p99HitLatency);
		this.uiModel.setProperty("/p95MissLatency", p95MissLatency);
		this.uiModel.setProperty("/p99MissLatency", p99MissLatency);
	}

	/**
	 * Handle period filter change
	 */
	public onPeriodFilterChange(): void {
		// Period changed, but don't auto-load - user needs to click Load button
	}

	/**
	 * Handle date filter change
	 */
	public onDateFilterChange(): void {
		// Date changed, but don't auto-load - user needs to click Load button
	}

	/**
	 * Handle load statistics button press
	 */
	public onLoadStatistics(): void {
		this.loadStatistics();
	}

	/**
	 * Handle refresh button press
	 */
	public onRefresh(): void {
		this.loadStatistics();
	}

	/**
	 * Handle chart metric change
	 */
	public onChartMetricChange(): void {
		// TODO: Implement chart update when metric changes
		// this.updateChartData();
	}

	/**
	 * Format bytes to human readable format
	 */
	private formatBytes(bytes: number): string {
		if (bytes === 0) return "0 B";
		const k = 1024;
		const sizes = ["B", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	}
} 