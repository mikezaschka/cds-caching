sap.ui.define(["sap/m/MessageBox", "./BaseController", "sap/ui/model/json/JSONModel", "sap/m/MessageToast", "sap/ui/core/Fragment"], function (MessageBox, __BaseController, JSONModel, MessageToast, Fragment) {
  "use strict";

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule && typeof obj.default !== "undefined" ? obj.default : obj;
  }
  const BaseController = _interopRequireDefault(__BaseController);
  /**
   * @namespace cds.plugin.caching.dashboard.controller
   */
  const Cache = BaseController.extend("cds.plugin.caching.dashboard.controller.Cache", {
    onInit: function _onInit() {
      BaseController.prototype.onInit.call(this);
      this.uiModel = new JSONModel({
        selectedTab: "main",
        statistics: [],
        loading: false,
        loadingEntries: false,
        showEntriesTable: false,
        cacheEntries: [],
        createKey: "",
        createValue: "",
        createTtl: 3600,
        getKey: "",
        getValue: "",
        deleteKey: "",
        metricsEnabled: false,
        keyMetricsEnabled: false
      });
      this.getView().setModel(this.uiModel, "ui");
      this.getRouter().getRoute("cache").attachPatternMatched(this.onRouteMatched, this);
    },
    onRouteMatched: function _onRouteMatched(event) {
      const {
        cache
      } = event.getParameter("arguments");
      this.getAppModel().setProperty("/selectedCache", cache);
      this.getAppModel().setProperty("/layout", "TwoColumnsMidExpanded");
      this.getView().bindElement({
        path: `/Caches('${cache.replace(/'/g, "''")}')`,
        events: {
          change: () => {
            const context = this.getView().getElementBinding()?.getBoundContext();
            if (context) {
              this.uiModel.setProperty("/config", context.getProperty("configuration"));
              this.loadStatistics();
              this.loadKeyMetricsData();
            }
          }
        }
      });
    },
    loadStatistics: function _loadStatistics(refresh = false) {
      const table = this.getView().byId("metricsTable");
      const binding = table.getBinding("rows");
      if (binding.isSuspended()) {
        binding.resume();
      }
      if (refresh) {
        binding.refresh();
      }
    },
    loadKeyMetricsData: function _loadKeyMetricsData(refresh = false) {
      const table = this.getView().byId("keyMetricsTable");
      const binding = table.getBinding("rows");
      if (binding.isSuspended()) {
        binding.resume();
      }
      if (refresh) {
        binding.refresh();
      }
    },
    onLoadCacheEntries: async function _onLoadCacheEntries() {
      const cacheContext = this.getView().getElementBinding().getBoundContext();
      try {
        this.uiModel.setProperty("/loadingEntries", true);
        this.uiModel.setProperty("/showEntriesTable", true);
        this.uiModel.setSizeLimit(100_000);
        const model = this.getODataModel();
        const context = model.bindContext(`plugin.cds_caching.CachingApiService.getEntries(...)`, cacheContext);
        await context.invoke();
        const {
          value: entries
        } = await context.requestObject();
        for (const entry of entries) {
          if (Array.isArray(entry.tags)) {
            entry.tags = entry.tags.join(", ");
          }
        }
        this.uiModel.setProperty("/cacheEntries", entries);
      } catch (error) {
        console.error("Error loading cache entries:", error);
        MessageBox.error(await this.i18nText("msgLoadEntriesFailed"));
      } finally {
        this.uiModel.setProperty("/loadingEntries", false);
      }
    },
    onMetricsRowSelect: function _onMetricsRowSelect(event) {
      const selectedRow = event.getParameter("rowContext");
      if (selectedRow) {
        const metric = selectedRow.getObject();
        const cacheName = this.getView().getElementBinding().getBoundContext().getProperty("name");
        this.getRouter().navTo("singleMetric", {
          cache: cacheName,
          metricId: metric.ID
        });
        this.getAppModel().setProperty("/layout", "ThreeColumnsEndExpanded");
      }
    },
    onSetKey: async function _onSetKey() {
      const cacheContext = this.getView().getElementBinding().getBoundContext();
      const key = this.uiModel.getProperty("/createKey");
      const value = this.uiModel.getProperty("/createValue");
      const ttl = this.uiModel.getProperty("/createTtl");
      if (!key || !value) {
        MessageBox.error(await this.i18nText("msgProvideKeyValue"));
        return;
      }
      try {
        const model = this.getODataModel();
        const context = model.bindContext(`plugin.cds_caching.CachingApiService.setEntry(...)`, cacheContext);
        context.setParameter("key", key);
        context.setParameter("value", value);
        context.setParameter("ttl", ttl);
        await context.invoke();
        MessageToast.show(await this.i18nText("msgEntryCreated"));
        this.uiModel.setProperty("/createKey", "");
        this.uiModel.setProperty("/createValue", "");
        this.uiModel.setProperty("/createTtl", 3600);
      } catch (error) {
        console.error("Error setting cache entry:", error);
        MessageBox.error(await this.i18nText("msgCreateEntryFailed"));
      }
    },
    onGetKey: async function _onGetKey() {
      const cacheContext = this.getView().getElementBinding().getBoundContext();
      const key = this.uiModel.getProperty("/getKey");
      if (!key) {
        MessageBox.error(await this.i18nText("msgProvideKey"));
        return;
      }
      try {
        const model = this.getODataModel();
        const action = model.bindContext(`plugin.cds_caching.CachingApiService.getEntry(...)`, cacheContext);
        action.setParameter("key", key);
        await action.invoke();
        const result = await action.requestObject();
        this.uiModel.setProperty("/getValue", result.value || (await this.i18nText("msgNotFound")));
      } catch (error) {
        console.error("Error getting cache entry:", error);
        this.uiModel.setProperty("/getValue", await this.i18nText("msgGetEntryError"));
      }
    },
    onDeleteKey: async function _onDeleteKey() {
      const cacheContext = this.getView().getElementBinding().getBoundContext();
      const key = this.uiModel.getProperty("/deleteKey");
      if (!key) {
        MessageBox.error(await this.i18nText("msgProvideKey"));
        return;
      }
      try {
        const model = this.getODataModel();
        const context = model.bindContext(`plugin.cds_caching.CachingApiService.deleteEntry(...)`, cacheContext);
        context.setParameter("key", key);
        await context.invoke();
        MessageToast.show(await this.i18nText("msgEntryDeleted"));
        this.uiModel.setProperty("/deleteKey", "");
      } catch (error) {
        console.error("Error deleting cache entry:", error);
        MessageBox.error(await this.i18nText("msgDeleteEntryFailed"));
      }
    },
    onEnableMetricsChange: async function _onEnableMetricsChange(event) {
      const enabled = event.getParameter("state");
      const cacheContext = this.getView().getElementBinding().getBoundContext();
      try {
        const model = this.getODataModel();
        const context = model.bindContext(`plugin.cds_caching.CachingApiService.setMetricsEnabled(...)`, cacheContext);
        context.setParameter("enabled", enabled);
        await context.invoke();
        MessageToast.show(await this.i18nText(enabled ? "msgMetricsEnabled" : "msgMetricsDisabled"));
      } catch (error) {
        console.error("Error setting metrics enabled:", error);
        MessageBox.error(await this.i18nText("msgFailedUpdateMetrics"));
        this.uiModel.setProperty("/metricsEnabled", !enabled);
      }
    },
    onEnableKeyMetricsChange: async function _onEnableKeyMetricsChange(event) {
      const enabled = event.getParameter("state");
      const cacheContext = this.getView().getElementBinding().getBoundContext();
      try {
        const model = this.getODataModel();
        const context = model.bindContext(`plugin.cds_caching.CachingApiService.setKeyMetricsEnabled(...)`, cacheContext);
        context.setParameter("enabled", enabled);
        await context.invoke();
        MessageToast.show(await this.i18nText(enabled ? "msgKeyMetricsEnabled" : "msgKeyMetricsDisabled"));
      } catch (error) {
        console.error("Error setting key metrics enabled:", error);
        MessageBox.error(await this.i18nText("msgFailedKeyMetrics"));
        this.uiModel.setProperty("/keyMetricsEnabled", !enabled);
      }
    },
    onClearCache: async function _onClearCache() {
      const cacheContext = this.getView().getElementBinding().getBoundContext();
      const confirmMsg = await this.i18nText("msgConfirmClearCache");
      MessageBox.confirm(confirmMsg, {
        actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
        emphasizedAction: MessageBox.Action.OK,
        onClose: async action => {
          if (action === MessageBox.Action.OK) {
            try {
              const model = this.getODataModel();
              const context = model.bindContext(`plugin.cds_caching.CachingApiService.clear(...)`, cacheContext);
              await context.invoke();
              MessageBox.success(await this.i18nText("msgCacheCleared"));
              await this.onRefresh();
            } catch (error) {
              console.error("Error clearing cache:", error);
              MessageBox.error(await this.i18nText("msgClearCacheFailed"));
            }
          }
        }
      });
    },
    onRefresh: async function _onRefresh() {
      if (this.getView().getElementBinding()?.getBoundContext()) {
        this.loadStatistics(true);
        this.loadKeyMetricsData(true);
      }
    },
    handleClose: function _handleClose() {
      this.getRouter().navTo("main");
    },
    handleFullScreen: function _handleFullScreen() {
      this.getAppModel().setProperty("/layout", "MidColumnFullScreen");
    },
    handleExitFullScreen: function _handleExitFullScreen() {
      this.getAppModel().setProperty("/layout", "TwoColumnsMidExpanded");
    },
    onKeyMetricsRowSelect: function _onKeyMetricsRowSelect(event) {
      const selectedRow = event.getParameter("rowContext");
      if (selectedRow) {
        const metric = selectedRow.getObject();
        const cacheName = this.getView().getElementBinding().getBoundContext().getProperty("name");
        this.getRouter().navTo("singleKeyMetric", {
          cache: cacheName,
          keyMetricId: metric.ID,
          keyName: encodeURIComponent(metric.keyName)
        });
        this.getAppModel().setProperty("/layout", "ThreeColumnsEndExpanded");
      }
    },
    onRefreshKeyMetricsData: async function _onRefreshKeyMetricsData() {
      this.loadKeyMetricsData(true);
    },
    onRefreshMetricsData: async function _onRefreshMetricsData() {
      this.loadStatistics(true);
    },
    onShowKeyMetricsMetadata: async function _onShowKeyMetricsMetadata(event) {
      const context = event.getSource().getBindingContext();
      const formatJson = json => {
        try {
          return JSON.stringify(JSON.parse(json), null, 2);
        } catch {
          return json;
        }
      };
      const localData = new JSONModel({
        metadata: formatJson(context.getProperty("metadata")),
        subject: formatJson(context.getProperty("subject")),
        query: formatJson(context.getProperty("query")),
        cacheOptions: formatJson(context.getProperty("cacheOptions")),
        keyName: context.getProperty("keyName")
      });
      const fragment = await Fragment.load({
        name: "cds.plugin.caching.dashboard.view.KeyMetricsMetadata",
        controller: this
      });
      const popover = fragment;
      popover.setModel(localData, "localData");
      popover.openBy(event.getSource());
    },
    onClearMetrics: async function _onClearMetrics() {
      const cacheContext = this.getView().getElementBinding().getBoundContext();
      if (!cacheContext) {
        return;
      }
      try {
        const model = this.getODataModel();
        const action = model.bindContext(`plugin.cds_caching.CachingApiService.clearMetrics(...)`, cacheContext);
        await action.invoke();
        MessageToast.show(await this.i18nText("msgMetricsCleared"));
        await this.onRefreshMetricsData();
      } catch (error) {
        console.error("Error clearing metrics:", error);
        MessageBox.error(await this.i18nText("msgFailedClearMetrics"));
      }
    },
    onClearKeyMetrics: async function _onClearKeyMetrics() {
      const cacheContext = this.getView().getElementBinding().getBoundContext();
      if (!cacheContext) {
        return;
      }
      try {
        const model = this.getODataModel();
        const action = model.bindContext(`plugin.cds_caching.CachingApiService.clearKeyMetrics(...)`, cacheContext);
        await action.invoke();
        MessageToast.show(await this.i18nText("msgKeyMetricsCleared"));
        await this.onRefreshKeyMetricsData();
      } catch (error) {
        console.error("Error clearing key metrics:", error);
        MessageBox.error(await this.i18nText("msgFailedClearKeyMetrics"));
      }
    }
  });
  return Cache;
});
//# sourceMappingURL=Cache-dbg.controller.js.map
