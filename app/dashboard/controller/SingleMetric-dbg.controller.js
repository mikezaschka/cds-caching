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
      this.uiModel = new JSONModel({
        metricId: "",
        hitRatio: 0,
        cacheEfficiency: 0,
        throughput: 0,
        errorRate: 0,
        avgLatency: 0,
        avgHitLatency: 0,
        avgMissLatency: 0,
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        errors: 0,
        nativeSets: 0,
        nativeGets: 0,
        nativeDeletes: 0,
        nativeClears: 0,
        nativeDeleteByTags: 0,
        nativeErrors: 0,
        totalNativeOperations: 0,
        nativeThroughput: 0,
        nativeErrorRate: 0,
        memoryUsage: 0,
        itemCount: 0,
        uniqueKeys: 0,
        uptimeMs: 0,
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
      this.getAppModel().setProperty("/layout", "ThreeColumnsEndExpanded");
      this.loadMetric(cache, metricId);
      this.formatChart();
    },
    escapeODataString: function _escapeODataString(value) {
      return value.replace(/'/g, "''");
    },
    loadMetric: async function _loadMetric(cacheName, metricId) {
      try {
        const model = this.getODataModel();
        const rb = await this.getResourceBundle();
        const context = model.bindContext(`/Metrics(ID='${this.escapeODataString(metricId)}',cache='${this.escapeODataString(cacheName)}')`);
        const metric = await context.requestObject();
        if (metric) {
          this.uiModel.setProperty("/hitRatio", metric.hitRatio || 0);
          this.uiModel.setProperty("/cacheEfficiency", metric.cacheEfficiency || 0);
          this.uiModel.setProperty("/throughput", metric.throughput || 0);
          this.uiModel.setProperty("/errorRate", metric.errorRate || 0);
          this.uiModel.setProperty("/avgLatency", metric.avgLatency || 0);
          this.uiModel.setProperty("/avgHitLatency", metric.avgHitLatency || 0);
          this.uiModel.setProperty("/avgMissLatency", metric.avgMissLatency || 0);
          this.uiModel.setProperty("/hits", metric.hits || 0);
          this.uiModel.setProperty("/misses", metric.misses || 0);
          this.uiModel.setProperty("/sets", metric.sets || 0);
          this.uiModel.setProperty("/deletes", metric.deletes || 0);
          this.uiModel.setProperty("/errors", metric.errors || 0);
          this.uiModel.setProperty("/nativeSets", metric.nativeSets || 0);
          this.uiModel.setProperty("/nativeGets", metric.nativeGets || 0);
          this.uiModel.setProperty("/nativeDeletes", metric.nativeDeletes || 0);
          this.uiModel.setProperty("/nativeClears", metric.nativeClears || 0);
          this.uiModel.setProperty("/nativeDeleteByTags", metric.nativeDeleteByTags || 0);
          this.uiModel.setProperty("/nativeErrors", metric.nativeErrors || 0);
          this.uiModel.setProperty("/totalNativeOperations", metric.totalNativeOperations || 0);
          this.uiModel.setProperty("/nativeThroughput", metric.nativeThroughput || 0);
          this.uiModel.setProperty("/nativeErrorRate", metric.nativeErrorRate || 0);
          this.uiModel.setProperty("/memoryUsage", metric.memoryUsage || 0);
          this.uiModel.setProperty("/itemCount", metric.itemCount || 0);
          this.uiModel.setProperty("/uptimeMs", metric.uptimeMs || 0);
          this.uiModel.setProperty("/uniqueKeys", 0);
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
    generateLatencyChartData: function _generateLatencyChartData(metric, rb) {
      const t = key => rb.getText(key);
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
    generateCacheThroughChartData: function _generateCacheThroughChartData(metric, rb) {
      const t = key => rb.getText(key);
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
    generateNativeChartData: function _generateNativeChartData(metric, rb) {
      const t = key => rb.getText(key);
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
    onRefresh: function _onRefresh() {
      const cacheName = this.getAppModel().getProperty("/selectedCache");
      const metricId = this.uiModel.getProperty("/metricId");
      if (cacheName && metricId) {
        this.loadMetric(cacheName, metricId);
      }
    },
    handleFullScreen: function _handleFullScreen() {
      this.getAppModel().setProperty("/layout", "EndColumnFullScreen");
    },
    handleExitFullScreen: function _handleExitFullScreen() {
      this.getAppModel().setProperty("/layout", "ThreeColumnsEndExpanded");
    },
    handleClose: function _handleClose() {
      this.getAppModel().setProperty("/layout", "TwoColumnsMidExpanded");
      this.getRouter().navTo("cache", {
        cache: this.getAppModel().getProperty("/selectedCache")
      });
    },
    onColumnsChange: function _onColumnsChange() {
      // Handle responsive grid column changes if needed
    }
  });
  return SingleMetric;
});
//# sourceMappingURL=SingleMetric-dbg.controller.js.map
