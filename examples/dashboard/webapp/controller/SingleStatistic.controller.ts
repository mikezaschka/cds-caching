import BaseController from "./BaseController";
import JSONModel from "sap/ui/model/json/JSONModel";
import ODataModel from "sap/ui/model/odata/v4/ODataModel";
import { Route$PatternMatchedEvent } from "sap/ui/core/routing/Route";
import MessageBox from "sap/m/MessageBox";

/**
 * @namespace cds.plugin.caching.dashboard.controller
 */
export default class SingleStatistic extends BaseController {
    private uiModel: JSONModel;

    public onInit(): void {
        super.onInit();

        // Create a JSON model for UI data binding
        this.uiModel = new JSONModel({
            statisticId: "",
            // Performance metrics
            hitRatio: 0,
            cacheEfficiency: 0,
            throughput: 0,
            errorRate: 0,
            // Latency metrics
            avgLatency: 0,
            avgHitLatency: 0,
            avgMissLatency: 0,
            avgSetLatency: 0,
            avgDeleteLatency: 0,
            // Operation counts
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            errors: 0,
            // Native function metrics
            nativeSets: 0,
            nativeGets: 0,
            nativeDeletes: 0,
            nativeClears: 0,
            nativeDeleteByTags: 0,
            nativeErrors: 0,
            totalNativeOperations: 0,
            nativeThroughput: 0,
            nativeErrorRate: 0,
            // System information
            memoryUsage: 0,
            itemCount: 0,
            uniqueKeys: 0,
            uptimeMs: 0,
            // Chart data
            latencyData: [],
            cacheThroughData: [],
            nativeData: []
        });
        this.getView().setModel(this.uiModel, "ui");

        this.getRouter().getRoute("singleStatistic").attachPatternMatched(this.onRouteMatched, this);
    }

    public onRouteMatched(event: Route$PatternMatchedEvent): void {
        const { cache, statisticId } = event.getParameter("arguments") as { cache: string; statisticId: string };

        this.uiModel.setProperty("/statisticId", statisticId);

        // Set layout to three columns
        (<JSONModel>this.getModel("app")).setProperty("/layout", "EndColumnFullScreen");

        // Load the specific statistic
        this.loadStatistic(cache, statisticId);

        this.formatChart();
    }

    /**
     * Load specific statistic data
     */
    private async loadStatistic(cacheName: string, statisticId: string): Promise<void> {
        try {
            const model = this.getModel() as ODataModel;

            // Try to get the statistic from the Statistics entity
            const context = model.bindContext(`/Statistics(ID='${statisticId}',cache='${cacheName}')`);
            const statistic = await context.requestObject();

            if (statistic) {
                // Set all the metric values
                this.uiModel.setProperty("/hitRatio", statistic.hitRatio || 0);
                this.uiModel.setProperty("/cacheEfficiency", statistic.cacheEfficiency || 0);
                this.uiModel.setProperty("/throughput", statistic.throughput || 0);
                this.uiModel.setProperty("/errorRate", statistic.errorRate || 0);

                // Latency metrics
                this.uiModel.setProperty("/avgLatency", statistic.avgLatency || 0);
                this.uiModel.setProperty("/avgHitLatency", statistic.avgHitLatency || 0);
                this.uiModel.setProperty("/avgMissLatency", statistic.avgMissLatency || 0);
                this.uiModel.setProperty("/avgSetLatency", statistic.avgSetLatency || 0);
                this.uiModel.setProperty("/avgDeleteLatency", statistic.avgDeleteLatency || 0);

                // Operation counts
                this.uiModel.setProperty("/hits", statistic.hits || 0);
                this.uiModel.setProperty("/misses", statistic.misses || 0);
                this.uiModel.setProperty("/sets", statistic.sets || 0);
                this.uiModel.setProperty("/deletes", statistic.deletes || 0);
                this.uiModel.setProperty("/errors", statistic.errors || 0);

                // Native function metrics
                this.uiModel.setProperty("/nativeSets", statistic.nativeSets || 0);
                this.uiModel.setProperty("/nativeGets", statistic.nativeGets || 0);
                this.uiModel.setProperty("/nativeDeletes", statistic.nativeDeletes || 0);
                this.uiModel.setProperty("/nativeClears", statistic.nativeClears || 0);
                this.uiModel.setProperty("/nativeDeleteByTags", statistic.nativeDeleteByTags || 0);
                this.uiModel.setProperty("/nativeErrors", statistic.nativeErrors || 0);
                this.uiModel.setProperty("/totalNativeOperations", statistic.totalNativeOperations || 0);
                this.uiModel.setProperty("/nativeThroughput", statistic.nativeThroughput || 0);
                this.uiModel.setProperty("/nativeErrorRate", statistic.nativeErrorRate || 0);

                // System information
                this.uiModel.setProperty("/memoryUsage", statistic.memoryUsage || 0);
                this.uiModel.setProperty("/itemCount", statistic.itemCount || 0);
                this.uiModel.setProperty("/uptimeMs", statistic.uptimeMs || 0);

                // Calculate unique keys (this might need to come from a different source)
                this.uiModel.setProperty("/uniqueKeys", 0); // TODO: Get from key tracking data

                // Generate chart data
                this.generateLatencyChartData(statistic);
                this.generateCacheThroughChartData(statistic);
                this.generateNativeChartData(statistic);

            } else {
                MessageBox.error("Statistic not found");
            }

        } catch (error) {
            console.error("Error loading statistic:", error);
            MessageBox.error("Failed to load statistic details");
        }
    }

    /**
     * Generate latency data for the chart
     */
    private generateLatencyChartData(statistic: any): void {
        const latencyData = [
            {
                operation: "Average Hit Latency",
                latency: statistic.avgHitLatency || 0
            },
            {
                operation: "Average Miss Latency",
                latency: statistic.avgMissLatency || 0
            },
            {
                operation: "Average Hit/Miss Latency",
                latency: statistic.avgHitMissLatency || 0
            }
        ];

        this.uiModel.setProperty("/latencyData", latencyData);
    }

    /**
     * Generate Read-Through operations data for pie chart
     */
    private generateCacheThroughChartData(statistic: any): void {
        const cacheThroughData = [
            {
                operation: "Hits",
                count: statistic.hits || 0
            },
            {
                operation: "Misses",
                count: statistic.misses || 0
            }
        ];

        this.uiModel.setProperty("/cacheThroughData", cacheThroughData);
    }

    /**
     * Generate Native Function operations data for pie chart
     */
    private generateNativeChartData(statistic: any): void {
        const nativeData = [
            {
                operation: "Sets",
                count: statistic.nativeSets || 0
            },
            {
                operation: "Gets",
                count: statistic.nativeGets || 0
            },
            {
                operation: "Deletes",
                count: statistic.nativeDeletes || 0
            },
            {
                operation: "Clears",
                count: statistic.nativeClears || 0
            },
            {
                operation: "Delete By Tags",
                count: statistic.nativeDeleteByTags || 0
            },
            {
                operation: "Errors",
                count: statistic.nativeErrors || 0
            }
        ];

        this.uiModel.setProperty("/nativeData", nativeData);
    }

    public formatChart() {
        // Format latency chart (bar chart)
        const latencyChart = this.getView().byId("latencyChart") as any;
        if (latencyChart) {
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

        // Format Read-Through pie chart
        const cacheThroughChart = this.getView().byId("cacheThroughChart") as any;
        if (cacheThroughChart) {
            cacheThroughChart.setVizProperties({
                legend: {
                    visible: true
                },
                plotArea: {
                    dataLabel: {
                        visible: true
                    }
                },
                title: {
                    visible: false
                }
            });
        }

        // Format Native Function pie chart
        const nativeChart = this.getView().byId("nativeChart") as any;
        if (nativeChart) {
            nativeChart.setVizProperties({
                legend: {
                    visible: true
                },
                plotArea: {
                    dataLabel: {
                        visible: true
                    }
                },
                title: {
                    visible: false
                }
            });
        }
    }

    /**
     * Handle refresh button press
     */
    public onRefresh(): void {
        const cacheName = this.getModel("app").getProperty("/selectedCache");
        const statisticId = this.uiModel.getProperty("/statisticId");

        if (cacheName && statisticId) {
            this.loadStatistic(cacheName, statisticId);
        }
    }

    /**
     * Handle full screen mode
     */
    public handleFullScreen(): void {
        (<JSONModel>this.getModel("app")).setProperty("/layout", "EndColumnFullScreen");
    }

    /**
     * Handle exit full screen mode
     */
    public handleExitFullScreen(): void {
        (<JSONModel>this.getModel("app")).setProperty("/layout", "ThreeColumnsEndExpanded");
    }

    /**
     * Handle close end column
     */
    public handleClose(): void {
        (<JSONModel>this.getModel("app")).setProperty("/layout", "TwoColumnsMidExpanded");
        this.getRouter().navTo("cache", { cache: this.getModel("app").getProperty("/selectedCache") });
    }

    /**
     * Handle grid columns change
     */
    public onColumnsChange(): void {
        // Handle responsive grid column changes if needed
    }
} 