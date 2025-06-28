import BaseController from "./BaseController";
import CacheStatisticsService, { CacheStatistics } from "../service/CacheStatisticsService";
import ODataModel from "sap/ui/model/odata/v4/ODataModel";
import JSONModel from "sap/ui/model/json/JSONModel";
import ComboBox from "sap/m/ComboBox";

/**
 * @namespace cds.plugin.caching.dashboard.controller
 */
export default class Main extends BaseController {
	private statisticsService: CacheStatisticsService;
	private refreshInterval: number | null = null;
	private uiModel: JSONModel;
	private viewModel: JSONModel;

	public onInit(): void {

		// Get the OData model from the component
		const odataModel = this.getOwnerComponent().getModel() as ODataModel;
		this.statisticsService = new CacheStatisticsService(odataModel);

		// Create a JSON model for UI data binding
		this.uiModel = new JSONModel({});
		this.viewModel = new JSONModel({
			selectedStatistic: null
		});
		this.getView().setModel(this.uiModel, "ui");
		this.getView().setModel(this.viewModel, "view");

		this.getRouter().getRoute("main").attachPatternMatched(this.onRouteMatched, this);

		const comboBox = this.getView().byId("statisticSelector") as ComboBox;
		comboBox.addEventDelegate({
			onAfterRendering: () => {
				if (this.viewModel.getProperty("/selectedStatistic") === null) {
					const items = comboBox.getItems();
					if (items && items.length > 1) {
						this.viewModel.setProperty("/selectedStatistic", items[1].getKey());
					}
				}
			}
		});

		//this.startAutoRefresh();
	}

	public onRouteMatched(): void {
		this.onRefresh();
	}

	public onExit(): void {
		if (this.refreshInterval) {
			clearInterval(this.refreshInterval);
		}
	}

	public async onRefresh(): Promise<void> {
		await this.loadData();
		await this.loadSelectedStatistic();
	}

	public async onStatisticChange(event: any): Promise<void> {
		const selectedItem = event.getParameter("selectedItem");
		const selectedKey = selectedItem.getKey();

		if (selectedKey) {
			await this.loadSelectedStatistic();
		}
	}

	/**
	 * Load data for the selected statistic
	 */
	private async loadSelectedStatistic(): Promise<void> {
		const cacheName = this.getModel("app").getProperty("/selectedCache");
		const selectedStatistic = this.viewModel.getProperty("/selectedStatistic");
		if (!cacheName || !selectedStatistic) {
			return;
		}

		try {
			const statistic = await this.statisticsService.getStatisticById(cacheName, selectedStatistic);

			if (statistic) {
				// Add the additional data to the statistics
				statistic.topKeys = []; // Historical stats don't have key data
				statistic.coldKeys = [];
				statistic.uniqueKeys = 0;

				// Set the data to the UI model
				this.uiModel.setData(statistic);
				this.prepareChartData(statistic);
				this.formatCharts();
			}
		} catch (error) {
			console.error("Error loading selected statistic:", error);
		}
	}

	/**
	 * Load current statistics data
	 */
	private async loadData(): Promise<void> {
		const cacheName = this.getModel("app").getProperty("/selectedCache");
		const selectedStatistic = this.viewModel.getProperty("/selectedStatistic");
		if (!cacheName) {
			return;
		}
		try {
			const [statistics, topKeys, coldKeys] = await Promise.all([
				this.statisticsService.getStatisticById(cacheName, selectedStatistic),
				this.statisticsService.getTopKeys(cacheName),
				this.statisticsService.getColdKeys(cacheName)
			]);

			if (statistics) {
				// Add the additional data to the statistics
				statistics.topKeys = topKeys;
				statistics.coldKeys = coldKeys;
				statistics.uniqueKeys = topKeys.length + coldKeys.length; // Approximate unique keys

				// Set the data to the UI model
				this.uiModel.setData(statistics);
				this.prepareChartData(statistics);
				this.formatCharts();
			}
		} catch (error) {
			console.error("Error loading statistics:", error);
		}
	}

	/**
	 * Prepare data for charts
	 */
	private prepareChartData(statistics: CacheStatistics): void {
		// Prepare latency data grouped by metric type (avg, P95, P99, etc.)
		const latencyData = [
			// Average latencies
			{ metricType: "Overall", latency: statistics.avgLatency || 0 },
			{ metricType: "Hit", latency: statistics.avgHitLatency || 0 },
			{ metricType: "Miss", latency: statistics.avgMissLatency || 0 },
			// { metricType: "Average", operation: "Set", latency: statistics.avgSetLatency || 0 },
			// { metricType: "Average", operation: "Delete", latency: statistics.avgDeleteLatency || 0 },

			// // P95 latencies
			// { metricType: "P95", operation: "Overall", latency: statistics.p95Latency || 0 },
			// { metricType: "P95", operation: "Hit", latency: statistics.p95HitLatency || 0 },
			// { metricType: "P95", operation: "Miss", latency: statistics.p95MissLatency || 0 },

			// // P99 latencies
			// { metricType: "P99", operation: "Overall", latency: statistics.p99Latency || 0 },
			// { metricType: "P99", operation: "Hit", latency: statistics.p99HitLatency || 0 },
			// { metricType: "P99", operation: "Miss", latency: statistics.p99MissLatency || 0 },

			// Min/Max latencies (only overall available)
			// { metricType: "Min", operation: "Overall", latency: statistics.minLatency || 0 },
			// { metricType: "Max", operation: "Overall", latency: statistics.maxLatency || 0 }
		].filter(item => item.latency > 0); // Only show metrics with actual data

		// Prepare operations data for pie chart
		const operationsData = [
			{ operation: "Hits", count: statistics.hits },
			{ operation: "Misses", count: statistics.misses },
			{ operation: "Sets", count: statistics.sets },
			{ operation: "Deletes", count: statistics.deletes }
		].filter(item => item.count > 0);

		this.uiModel.setProperty("/latencyData", latencyData);
		this.uiModel.setProperty("/operationsData", operationsData);
	}

	private formatCharts() {
		const latencyChart = this.getView().byId("latencyChart") as any;
		latencyChart.setVizProperties({
			legend: {
				visible: false
			},
			plotArea: {
				dataLabel: {
					visible: true,
					formatString: "#,## ms"
				},
				gridline: {
					visible: false
				}
			},
			valueAxis: {
				axisLine: {
					visible: false
				},
				axisTick: {
					visible: false
				},
				label: {
					visible: false
				},
				title: {
					visible: false
				}
			},
			categoryAxis: {
				title: {
					visible: false
				}
			},
			title: {
				visible: false,
				text: 'Latency by Operation'
			}
		});
	}

	/**
	 * Start auto-refresh every 30 seconds
	 */
	private startAutoRefresh(): void {
		this.refreshInterval = window.setInterval(() => {
			this.loadData();
		}, 30000);
	}

}
