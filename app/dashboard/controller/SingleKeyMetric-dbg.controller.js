sap.ui.define(["./BaseController", "sap/ui/model/json/JSONModel", "sap/m/MessageBox"], function (__BaseController, JSONModel, MessageBox) {
  "use strict";

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule && typeof obj.default !== "undefined" ? obj.default : obj;
  }
  const BaseController = _interopRequireDefault(__BaseController);
  /**
   * @namespace cds.plugin.caching.dashboard.controller
   */
  const SingleKeyMetric = BaseController.extend("cds.plugin.caching.dashboard.controller.SingleKeyMetric", {
    onInit: function _onInit() {
      BaseController.prototype.onInit.call(this);
      this.uiModel = new JSONModel({
        keyMetricId: "",
        keyName: "",
        operation: "",
        dataType: "",
        operationType: "",
        target: "",
        tenant: "",
        user: "",
        locale: "",
        hits: 0,
        misses: 0,
        totalRequests: 0,
        hitRatio: 0,
        cacheEfficiency: 0,
        avgHitLatency: 0,
        avgMissLatency: 0,
        nativeHits: 0,
        nativeMisses: 0,
        nativeSets: 0,
        nativeDeletes: 0,
        metadata: "",
        subject: "",
        query: "",
        cacheOptions: "",
        lastAccess: "",
        timestamp: ""
      });
      this.getView().setModel(this.uiModel, "ui");
      this.getRouter().getRoute("singleKeyMetric").attachPatternMatched(this.onRouteMatched, this);
    },
    onRouteMatched: function _onRouteMatched(event) {
      const {
        cache,
        keyMetricId,
        keyName
      } = event.getParameter("arguments");
      this.uiModel.setProperty("/keyMetricId", keyMetricId);
      this.getAppModel().setProperty("/layout", "ThreeColumnsEndExpanded");
      this.loadKeyMetric(cache, keyMetricId, decodeURIComponent(keyName));
    },
    escapeODataString: function _escapeODataString(value) {
      return value.replace(/'/g, "''");
    },
    formatJson: function _formatJson(value) {
      if (!value) {
        return "";
      }
      try {
        return JSON.stringify(JSON.parse(value), null, 2);
      } catch {
        return value;
      }
    },
    loadKeyMetric: async function _loadKeyMetric(cacheName, keyMetricId, keyName) {
      try {
        const model = this.getODataModel();
        const context = model.bindContext(`/KeyMetrics(ID='${this.escapeODataString(keyMetricId)}',cache='${this.escapeODataString(cacheName)}',keyName='${this.escapeODataString(keyName)}')`);
        const metric = await context.requestObject();
        if (metric) {
          this.uiModel.setProperty("/keyName", metric.keyName || keyName);
          this.uiModel.setProperty("/operation", metric.operation || "");
          this.uiModel.setProperty("/dataType", metric.dataType || "");
          this.uiModel.setProperty("/operationType", metric.operationType || "");
          this.uiModel.setProperty("/target", metric.target || "");
          this.uiModel.setProperty("/tenant", metric.tenant || "");
          this.uiModel.setProperty("/user", metric.user || "");
          this.uiModel.setProperty("/locale", metric.locale || "");
          this.uiModel.setProperty("/hits", metric.hits || 0);
          this.uiModel.setProperty("/misses", metric.misses || 0);
          this.uiModel.setProperty("/totalRequests", metric.totalRequests || 0);
          this.uiModel.setProperty("/hitRatio", metric.hitRatio || 0);
          this.uiModel.setProperty("/cacheEfficiency", metric.cacheEfficiency || 0);
          this.uiModel.setProperty("/avgHitLatency", metric.avgHitLatency || 0);
          this.uiModel.setProperty("/avgMissLatency", metric.avgMissLatency || 0);
          this.uiModel.setProperty("/nativeHits", metric.nativeHits || 0);
          this.uiModel.setProperty("/nativeMisses", metric.nativeMisses || 0);
          this.uiModel.setProperty("/nativeSets", metric.nativeSets || 0);
          this.uiModel.setProperty("/nativeDeletes", metric.nativeDeletes || 0);
          this.uiModel.setProperty("/metadata", this.formatJson(metric.metadata || ""));
          this.uiModel.setProperty("/subject", this.formatJson(metric.subject || ""));
          this.uiModel.setProperty("/query", this.formatJson(metric.query || ""));
          this.uiModel.setProperty("/cacheOptions", this.formatJson(metric.cacheOptions || ""));
          this.uiModel.setProperty("/lastAccess", metric.lastAccess || "");
          this.uiModel.setProperty("/timestamp", metric.timestamp || "");
        } else {
          MessageBox.error(await this.i18nText("msgMetricNotFound"));
        }
      } catch (error) {
        console.error("Error loading key metric:", error);
        MessageBox.error(await this.i18nText("msgLoadMetricFailed"));
      }
    },
    onRefresh: function _onRefresh() {
      const cacheName = this.getAppModel().getProperty("/selectedCache");
      const keyMetricId = this.uiModel.getProperty("/keyMetricId");
      const keyName = this.uiModel.getProperty("/keyName");
      if (cacheName && keyMetricId && keyName) {
        this.loadKeyMetric(cacheName, keyMetricId, keyName);
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
    }
  });
  return SingleKeyMetric;
});
//# sourceMappingURL=SingleKeyMetric-dbg.controller.js.map
