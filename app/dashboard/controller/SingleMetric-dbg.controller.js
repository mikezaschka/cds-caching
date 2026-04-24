sap.ui.define(["./BaseController", "sap/ui/model/json/JSONModel", "sap/m/MessageBox"], function (__BaseController, JSONModel, MessageBox) {
  "use strict";

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule && typeof obj.default !== "undefined" ? obj.default : obj;
  }
  const BaseController = _interopRequireDefault(__BaseController);
  /**
   * @namespace cds.plugin.caching.dashboard.controller
   */
  const SingleMetric = BaseController.extend("cds.plugin.caching.dashboard.controller.SingleMetric", {
    onInit: function _onInit() {
      BaseController.prototype.onInit.call(this);

      // Create a JSON model for UI data binding
      this.uiModel = new JSONModel({
        metricId: "",
        // Performance metrics
        hitRatio: 0,
        cacheEfficiency: 0,
        throughput: 0,
        errorRate: 0,
        // Latency metrics
        avgLatency: 0,
        avgHitLatency: 0,
        avgMissLatency: 0,
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
      this.getRouter().getRoute("singleMetric").attachPatternMatched(this.onRouteMatched, this);
    },
    onRouteMatched: function _onRouteMatched(event) {
      const {
        cache,
        metricId
      } = event.getParameter("arguments");
      this.uiModel.setProperty("/metricId", metricId);

      // Set layout to three columns
      this.getModel("app").setProperty("/layout", "ThreeColumnsEndExpanded");

      // Load the specific metric
      this.loadMetric(cache, metricId);
      this.formatChart();
    },
    /**
     * Load specific metric data
     */
    loadMetric: async function _loadMetric(cacheName, metricId) {
      try {
        const model = this.getModel();
        const rb = await this.getResourceBundle();

        // Try to get the metric from the Metrics entity
        const context = model.bindContext(`/Metrics(ID='${metricId}',cache='${cacheName}')`);
        const metric = await context.requestObject();
        if (metric) {
          // Set all the metric values
          this.uiModel.setProperty("/hitRatio", metric.hitRatio || 0);
          this.uiModel.setProperty("/cacheEfficiency", metric.cacheEfficiency || 0);
          this.uiModel.setProperty("/throughput", metric.throughput || 0);
          this.uiModel.setProperty("/errorRate", metric.errorRate || 0);

          // Latency metrics
          this.uiModel.setProperty("/avgLatency", metric.avgLatency || 0);
          this.uiModel.setProperty("/avgHitLatency", metric.avgHitLatency || 0);
          this.uiModel.setProperty("/avgMissLatency", metric.avgMissLatency || 0);

          // Operation counts
          this.uiModel.setProperty("/hits", metric.hits || 0);
          this.uiModel.setProperty("/misses", metric.misses || 0);
          this.uiModel.setProperty("/sets", metric.sets || 0);
          this.uiModel.setProperty("/deletes", metric.deletes || 0);
          this.uiModel.setProperty("/errors", metric.errors || 0);

          // Native function metrics
          this.uiModel.setProperty("/nativeSets", metric.nativeSets || 0);
          this.uiModel.setProperty("/nativeGets", metric.nativeGets || 0);
          this.uiModel.setProperty("/nativeDeletes", metric.nativeDeletes || 0);
          this.uiModel.setProperty("/nativeClears", metric.nativeClears || 0);
          this.uiModel.setProperty("/nativeDeleteByTags", metric.nativeDeleteByTags || 0);
          this.uiModel.setProperty("/nativeErrors", metric.nativeErrors || 0);
          this.uiModel.setProperty("/totalNativeOperations", metric.totalNativeOperations || 0);
          this.uiModel.setProperty("/nativeThroughput", metric.nativeThroughput || 0);
          this.uiModel.setProperty("/nativeErrorRate", metric.nativeErrorRate || 0);

          // System information
          this.uiModel.setProperty("/memoryUsage", metric.memoryUsage || 0);
          this.uiModel.setProperty("/itemCount", metric.itemCount || 0);
          this.uiModel.setProperty("/uptimeMs", metric.uptimeMs || 0);

          // Calculate unique keys (this might need to come from a different source)
          this.uiModel.setProperty("/uniqueKeys", 0); // TODO: Get from key metrics data

          // Generate chart data
          this.generateLatencyChartData(metric, rb);
          this.generateCacheThroughChartData(metric, rb);
          this.generateNativeChartData(metric, rb);
        } else {
          MessageBox.error(await this.i18nText("msgMetricNotFound"));
        }
      } catch (error) {
        console.error("Error loading metric:", error);
        MessageBox.error(await this.i18nText("msgLoadMetricFailed"));
      }
    },
    /**
     * Generate latency data for the chart
     */
    generateLatencyChartData: function _generateLatencyChartData(metric, rb) {
      const t = k => rb.getText(k);
      const latencyData = [{
        operation: t("chartOpAvgHitLatency"),
        latency: metric.avgHitLatency || 0
      }, {
        operation: t("chartOpAvgMissLatency"),
        latency: metric.avgMissLatency || 0
      }, {
        operation: t("chartOpAvgReadThroughLatency"),
        latency: metric.avgReadThroughLatency || 0
      }];
      this.uiModel.setProperty("/latencyData", latencyData);
    },
    /**
     * Generate Read-Through operations data for pie chart
     */
    generateCacheThroughChartData: function _generateCacheThroughChartData(metric, rb) {
      const t = k => rb.getText(k);
      const cacheThroughData = [{
        operation: t("chartOpHits"),
        count: metric.hits || 0
      }, {
        operation: t("chartOpMisses"),
        count: metric.misses || 0
      }, {
        operation: t("chartOpErrors"),
        count: metric.errors || 0
      }];
      this.uiModel.setProperty("/cacheThroughData", cacheThroughData);
    },
    /**
     * Generate Native Function operations data for pie chart
     */
    generateNativeChartData: function _generateNativeChartData(metric, rb) {
      const t = k => rb.getText(k);
      const nativeData = [{
        operation: t("chartOpSets"),
        count: metric.nativeSets || 0
      }, {
        operation: t("chartOpGets"),
        count: metric.nativeGets || 0
      }, {
        operation: t("chartOpDeletes"),
        count: metric.nativeDeletes || 0
      }, {
        operation: t("chartOpClears"),
        count: metric.nativeClears || 0
      }, {
        operation: t("chartOpDeleteByTags"),
        count: metric.nativeDeleteByTags || 0
      }, {
        operation: t("chartOpErrors"),
        count: metric.nativeErrors || 0
      }];
      this.uiModel.setProperty("/nativeData", nativeData);
    },
    formatChart: function _formatChart() {
      // Format latency chart (bar chart)
      const latencyChart = this.getView().byId("metricLatencyChart");
      if (latencyChart) {
        void this.getResourceBundle().then(rb => {
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
              text: rb.getText("chartTitleLatencyByOperation")
            }
          });
        });
      }

      // Format Read-Through pie chart
      const cacheThroughChart = this.getView().byId("metricCacheThroughChart");
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
      const nativeChart = this.getView().byId("metricNativeChart");
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
    },
    /**
     * Handle refresh button press
     */
    onRefresh: function _onRefresh() {
      const cacheName = this.getModel("app").getProperty("/selectedCache");
      const metricId = this.uiModel.getProperty("/metricId");
      if (cacheName && metricId) {
        this.loadMetric(cacheName, metricId);
      }
    },
    /**
     * Handle full screen mode
     */
    handleFullScreen: function _handleFullScreen() {
      this.getModel("app").setProperty("/layout", "EndColumnFullScreen");
    },
    /**
     * Handle exit full screen mode
     */
    handleExitFullScreen: function _handleExitFullScreen() {
      this.getModel("app").setProperty("/layout", "ThreeColumnsEndExpanded");
    },
    /**
     * Handle close end column
     */
    handleClose: function _handleClose() {
      this.getModel("app").setProperty("/layout", "TwoColumnsMidExpanded");
      this.getRouter().navTo("cache", {
        cache: this.getModel("app").getProperty("/selectedCache")
      });
    },
    /**
     * Handle grid columns change
     */
    onColumnsChange: function _onColumnsChange() {
      // Handle responsive grid column changes if needed
    }
  });
  return SingleMetric;
});
//# sourceMappingURL=SingleMetric-dbg.controller.js.map
