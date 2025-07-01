import BaseController from "./BaseController";
import JSONModel from "sap/ui/model/json/JSONModel";
import ODataModel from "sap/ui/model/odata/v4/ODataModel";
import { Route$PatternMatchedEvent } from "sap/ui/core/routing/Route";
import MessageBox from "sap/m/MessageBox";

/**
 * @namespace cds.plugin.caching.dashboard.controller
 */
export default class SingleKeyMetric extends BaseController {
    private uiModel: JSONModel;

    public onInit(): void {
        super.onInit();

        // Create a JSON model for UI data binding
        this.uiModel = new JSONModel({
            keyName: "",
            // Key information
            operationType: "",
            operation: "",
            dataType: "",
            serviceName: "",
            entityName: "",
            lastAccess: "",
            timestamp: "",
            tenant: "",
            user: "",
            locale: "",
            // Performance metrics
            hitRatio: 0,
            cacheEfficiency: 0,
            throughput: 0,
            errorRate: 0,
            // Latency metrics
            avgHitLatency: 0,
            avgMissLatency: 0,
            avgSetLatency: 0,
            avgDeleteLatency: 0,
            avgReadThroughLatency: 0,
            // Operation counts
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            errors: 0,
            totalRequests: 0,
            // Native function metrics
            nativeHits: 0,
            nativeMisses: 0,
            nativeSets: 0,
            nativeDeletes: 0,
            nativeClears: 0,
            nativeDeleteByTags: 0,
            nativeErrors: 0,
            totalNativeOperations: 0,
            nativeThroughput: 0,
            nativeErrorRate: 0,
            // Chart data
            latencyData: [],
            cacheThroughData: [],
            nativeData: []
        });
        this.getView().setModel(this.uiModel, "ui");

        this.getRouter().getRoute("singleKeyMetric").attachPatternMatched(this.onRouteMatched, this);
    }

    public onRouteMatched(event: Route$PatternMatchedEvent): void {
        const { cache, keyMetricId } = event.getParameter("arguments") as { cache: string; keyMetricId: string };

        this.uiModel.setProperty("/keyMetricId", keyMetricId);

        // Set layout to three columns
        (<JSONModel>this.getModel("app")).setProperty("/layout", "EndColumnFullScreen");

        // Load the specific key metric
        this.loadKeyMetric(cache, keyMetricId);

        this.formatChart();
    }

    /**
     * Load specific key metric data
     */
    private async loadKeyMetric(cacheName: string, keyName: string): Promise<void> {
        try {
            const model = this.getModel() as ODataModel;

            // Try to get the key metric from the KeyMetrics entity
            const context = model.bindContext(`/KeyMetrics(cache='${cacheName}',keyName='${keyName}')`);
            const keyMetric = await context.requestObject();

            if (keyMetric) {
                // Set key information
                this.uiModel.setProperty("/operationType", keyMetric.operationType || "");
                this.uiModel.setProperty("/operation", keyMetric.operation || "");
                this.uiModel.setProperty("/dataType", keyMetric.dataType || "");
                this.uiModel.setProperty("/serviceName", keyMetric.serviceName || "");
                this.uiModel.setProperty("/entityName", keyMetric.entityName || "");
                this.uiModel.setProperty("/lastAccess", keyMetric.lastAccess || "");
                this.uiModel.setProperty("/timestamp", keyMetric.timestamp || "");
                this.uiModel.setProperty("/tenant", keyMetric.tenant || "");
                this.uiModel.setProperty("/user", keyMetric.user || "");
                this.uiModel.setProperty("/locale", keyMetric.locale || "");

                // Set performance metrics
                this.uiModel.setProperty("/hitRatio", keyMetric.hitRatio || 0);
                this.uiModel.setProperty("/cacheEfficiency", keyMetric.cacheEfficiency || 0);
                this.uiModel.setProperty("/throughput", keyMetric.throughput || 0);
                this.uiModel.setProperty("/errorRate", keyMetric.errorRate || 0);

                // Latency metrics
                this.uiModel.setProperty("/avgHitLatency", keyMetric.avgHitLatency || 0);
                this.uiModel.setProperty("/avgMissLatency", keyMetric.avgMissLatency || 0);
                this.uiModel.setProperty("/avgSetLatency", keyMetric.avgSetLatency || 0);
                this.uiModel.setProperty("/avgDeleteLatency", keyMetric.avgDeleteLatency || 0);
                this.uiModel.setProperty("/avgReadThroughLatency", keyMetric.avgReadThroughLatency || 0);

                // Operation counts
                this.uiModel.setProperty("/hits", keyMetric.hits || 0);
                this.uiModel.setProperty("/misses", keyMetric.misses || 0);
                this.uiModel.setProperty("/sets", keyMetric.sets || 0);
                this.uiModel.setProperty("/deletes", keyMetric.deletes || 0);
                this.uiModel.setProperty("/errors", keyMetric.errors || 0);
                this.uiModel.setProperty("/totalRequests", keyMetric.totalRequests || 0);

                // Native function metrics
                this.uiModel.setProperty("/nativeHits", keyMetric.nativeHits || 0);
                this.uiModel.setProperty("/nativeMisses", keyMetric.nativeMisses || 0);
                this.uiModel.setProperty("/nativeSets", keyMetric.nativeSets || 0);
                this.uiModel.setProperty("/nativeDeletes", keyMetric.nativeDeletes || 0);
                this.uiModel.setProperty("/nativeClears", keyMetric.nativeClears || 0);
                this.uiModel.setProperty("/nativeDeleteByTags", keyMetric.nativeDeleteByTags || 0);
                this.uiModel.setProperty("/nativeErrors", keyMetric.nativeErrors || 0);
                this.uiModel.setProperty("/totalNativeOperations", keyMetric.totalNativeOperations || 0);
                this.uiModel.setProperty("/nativeThroughput", keyMetric.nativeThroughput || 0);
                this.uiModel.setProperty("/nativeErrorRate", keyMetric.nativeErrorRate || 0);

                // Generate chart data
                this.generateLatencyChartData(keyMetric);
                this.generateCacheThroughChartData(keyMetric);
                this.generateNativeChartData(keyMetric);

            } else {
                MessageBox.error("Key metric not found");
            }

        } catch (error) {
            console.error("Error loading key metric:", error);
            MessageBox.error("Failed to load key metric details");
        }
    }

    /**
     * Generate latency data for the chart
     */
    private generateLatencyChartData(keyMetric: any): void {
        const latencyData = [
            {
                operation: "Average Hit Latency",
                latency: keyMetric.avgHitLatency || 0
            },
            {
                operation: "Average Miss Latency",
                latency: keyMetric.avgMissLatency || 0
            },
            {
                operation: "Average Read-Through Latency",
                latency: keyMetric.avgReadThroughLatency || 0
            }
        ];

        this.uiModel.setProperty("/latencyData", latencyData);
    }

    /**
     * Generate Read-Through operations data for pie chart
     */
    private generateCacheThroughChartData(keyMetric: any): void {
        const cacheThroughData = [
            {
                operation: "Hits",
                count: keyMetric.hits || 0
            },
            {
                operation: "Misses",
                count: keyMetric.misses || 0
            },
            {
                operation: "Errors",
                count: keyMetric.errors || 0
            }
        ];

        this.uiModel.setProperty("/cacheThroughData", cacheThroughData);
    }

    /**
     * Generate Native Function operations data for pie chart
     */
    private generateNativeChartData(keyMetric: any): void {
        const nativeData = [
            {
                operation: "Hits",
                count: keyMetric.nativeHits || 0
            },
            {
                operation: "Misses",
                count: keyMetric.nativeMisses || 0
            },
            {
                operation: "Sets",
                count: keyMetric.nativeSets || 0
            },
            {
                operation: "Deletes",
                count: keyMetric.nativeDeletes || 0
            },
            {
                operation: "Clears",
                count: keyMetric.nativeClears || 0
            },
            {
                operation: "Delete By Tags",
                count: keyMetric.nativeDeleteByTags || 0
            },
            {
                operation: "Errors",
                count: keyMetric.nativeErrors || 0
            }
        ];

        this.uiModel.setProperty("/nativeData", nativeData);
    }

    public formatChart() {
        // Format latency chart (bar chart)
        const latencyChart = this.getView().byId("keyMetricLatencyChart") as any;
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
        const cacheThroughChart = this.getView().byId("keyMetricCacheThroughChart") as any;
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
        const nativeChart = this.getView().byId("keyMetricNativeChart") as any;
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
        const keyName = this.uiModel.getProperty("/keyName");

        if (cacheName && keyName) {
            this.loadKeyMetric(cacheName, keyName);
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