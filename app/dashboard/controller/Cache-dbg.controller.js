sap.ui.define(["sap/m/MessageBox", "./BaseController", "sap/ui/model/json/JSONModel", "sap/m/MessageToast", "sap/ui/model/Filter", "sap/ui/model/FilterOperator", "sap/ui/core/Fragment"], function (MessageBox, __BaseController, JSONModel, MessageToast, Filter, FilterOperator, Fragment) {
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

      // Create a JSON model for UI data binding
      this.uiModel = new JSONModel({
        selectedTab: "main",
        statistics: [],
        loading: false,
        loadingEntries: false,
        showEntriesTable: false,
        cacheEntries: [],
        // Create
        createKey: "",
        createValue: "",
        createTtl: 3600,
        // Get
        getKey: "",
        getValue: "",
        // Delete
        deleteKey: "",
        // Metrics
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
      this.getModel("app").setProperty("/selectedCache", cache);
      this.getModel("app").setProperty("/layout", "TwoColumnsMidExpanded");
      this.getView().bindElement({
        path: "/Caches('" + cache + "')",
        events: {
          change: event => {
            const context = this.getView().getElementBinding().getBoundContext();
            if (context) {
              const cache = context.getProperty("configuration");
              this.uiModel.setProperty("/config", cache);
              this.loadStatistics();
              this.loadKeyMetricsData();
            }
          }
        }
      });
    },
    /**
     * Load statistics based on current filters
     */
    loadStatistics: async function _loadStatistics(refresh = false) {
      const table = this.getView().byId("metricsTable");
      const filter = new Filter("cache", FilterOperator.EQ, this.getModel("app").getProperty("/selectedCache"));
      if (table.getBinding("rows").isSuspended()) {
        table.getBinding("rows").resume();
      }
      if (refresh) {
        table.getBinding("rows").refresh();
      } else {
        table.getBinding("rows").filter(filter);
      }
    },
    /**
     * Load key tracking data
     */
    loadKeyMetricsData: async function _loadKeyMetricsData(refresh = false) {
      const table = this.getView().byId("keyMetricsTable");
      const filter = new Filter("cache", FilterOperator.EQ, this.getModel("app").getProperty("/selectedCache"));
      if (table.getBinding("rows").isSuspended()) {
        table.getBinding("rows").resume();
      }
      if (refresh) {
        table.getBinding("rows").refresh();
      } else {
        table.getBinding("rows").filter(filter);
      }
    },
    /**
     * Load cache entries
     */
    onLoadCacheEntries: async function _onLoadCacheEntries() {
      const cacheContext = this.getView().getElementBinding().getBoundContext();
      try {
        this.uiModel.setProperty("/loadingEntries", true);
        this.uiModel.setProperty("/showEntriesTable", true);
        this.uiModel.setSizeLimit(100_000);

        // Call the backend to get cache entries
        const model = this.getModel();
        const context = model.bindContext(`plugin.cds_caching.CachingApiService.getEntries(...)`, cacheContext);
        await context.invoke();
        const {
          value: entries
        } = await context.requestObject();
        for (const entry of entries) {
          entry.tags = entry.tags.join(", ");
        }
        this.uiModel.setProperty("/cacheEntries", entries);
      } catch (error) {
        console.error("Error loading cache entries:", error);
        MessageBox.error(await this.i18nText("msgLoadEntriesFailed"));
      } finally {
        this.uiModel.setProperty("/loadingEntries", false);
      }
    },
    /**
     * Handle statistics row selection
     */
    onMetricsRowSelect: function _onMetricsRowSelect(event) {
      const selectedRow = event.getParameter("rowContext");
      if (selectedRow) {
        const metric = selectedRow.getObject();
        const cacheName = this.getView().getElementBinding().getBoundContext().getProperty("name");

        // Navigate to single metric view
        this.getRouter().navTo("singleMetric", {
          cache: cacheName,
          metricId: metric.ID
        });

        // Set layout to three columns
        this.getModel("app").setProperty("/layout", "ThreeColumnsEndExpanded");
      }
    },
    /**
     * Set cache entry
     */
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
        const model = this.getModel();
        const context = model.bindContext(`plugin.cds_caching.CachingApiService.setEntry(...)`, cacheContext);
        context.setParameter("key", key);
        context.setParameter("value", value);
        context.setParameter("ttl", ttl);
        await context.invoke();
        MessageToast.show(await this.i18nText("msgEntryCreated"));

        // Clear form
        this.uiModel.setProperty("/createKey", "");
        this.uiModel.setProperty("/createValue", "");
        this.uiModel.setProperty("/createTtl", 3600);
      } catch (error) {
        console.error("Error setting cache entry:", error);
        MessageBox.error(await this.i18nText("msgCreateEntryFailed"));
      }
    },
    /**
     * Get cache entry
     */
    onGetKey: async function _onGetKey() {
      const cacheContext = this.getView().getElementBinding().getBoundContext();
      const key = this.uiModel.getProperty("/getKey");
      if (!key) {
        MessageBox.error(await this.i18nText("msgProvideKey"));
        return;
      }
      try {
        const model = this.getModel();
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
    /**
     * Delete cache entry
     */
    onDeleteKey: async function _onDeleteKey() {
      const cacheContext = this.getView().getElementBinding().getBoundContext();
      const key = this.uiModel.getProperty("/deleteKey");
      if (!key) {
        MessageBox.error(await this.i18nText("msgProvideKey"));
        return;
      }
      try {
        const model = this.getModel();
        const context = model.bindContext(`plugin.cds_caching.CachingApiService.deleteEntry(...)`, cacheContext);
        context.setParameter("key", key);
        await context.invoke();
        MessageToast.show(await this.i18nText("msgEntryDeleted"));

        // Clear form
        this.uiModel.setProperty("/deleteKey", "");
      } catch (error) {
        console.error("Error deleting cache entry:", error);
        MessageBox.error(await this.i18nText("msgDeleteEntryFailed"));
      }
    },
    /**
     * Enable/disable statistics
     */
    onEnableMetricsChange: async function _onEnableMetricsChange(event) {
      const enabled = event.getParameter("state");
      const cacheContext = this.getView().getElementBinding().getBoundContext();
      try {
        const model = this.getModel();
        const context = model.bindContext(`plugin.cds_caching.CachingApiService.setMetricsEnabled(...)`, cacheContext);
        context.setParameter("enabled", enabled);
        await context.invoke();
        MessageToast.show(await this.i18nText(enabled ? "msgMetricsEnabled" : "msgMetricsDisabled"));
      } catch (error) {
        console.error("Error setting metrics enabled:", error);
        MessageBox.error(await this.i18nText("msgFailedUpdateMetrics"));
        // Revert the switch
        this.uiModel.setProperty("/enableMetrics", !enabled);
      }
    },
    /**
     * Enable/disable key tracking
     */
    onEnableKeyMetricsChange: async function _onEnableKeyMetricsChange(event) {
      const enabled = event.getParameter("state");
      const cacheContext = this.getView().getElementBinding().getBoundContext();
      try {
        const model = this.getModel();
        const context = model.bindContext(`plugin.cds_caching.CachingApiService.setKeyMetricsEnabled(...)`, cacheContext);
        context.setParameter("enabled", enabled);
        await context.invoke();
        MessageToast.show(await this.i18nText(enabled ? "msgKeyMetricsEnabled" : "msgKeyMetricsDisabled"));
      } catch (error) {
        console.error("Error setting key metrics enabled:", error);
        MessageBox.error(await this.i18nText("msgFailedKeyMetrics"));
        // Revert the switch
        this.uiModel.setProperty("/enableKeyMetrics", !enabled);
      }
    },
    /**
     * Clear cache
     */
    onClearCache: async function _onClearCache() {
      const cacheContext = this.getView().getElementBinding().getBoundContext();
      const confirmMsg = await this.i18nText("msgConfirmClearCache");
      MessageBox.confirm(confirmMsg, {
        actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
        emphasizedAction: MessageBox.Action.OK,
        onClose: async action => {
          if (action === MessageBox.Action.OK) {
            try {
              const model = this.getModel();
              const context = model.bindContext(`plugin.cds_caching.CachingApiService.clear(...)`, cacheContext);
              await context.invoke();
              MessageBox.success(await this.i18nText("msgCacheCleared"));

              // Refresh the data
              await this.onRefresh();
            } catch (error) {
              console.error("Error clearing cache:", error);
              MessageBox.error(await this.i18nText("msgClearCacheFailed"));
            }
          }
        }
      });
    },
    /**
     * Handle refresh button press
     */
    onRefresh: async function _onRefresh() {
      if (this.getView().getElementBinding().getBoundContext()) {
        await this.loadStatistics(true);
        await this.loadKeyMetricsData(true);
      }
    },
    handleClose: function _handleClose() {
      this.getRouter().navTo("main");
    },
    handleFullScreen: function _handleFullScreen() {
      this.getModel("app").setProperty("/layout", "MidColumnFullScreen");
    },
    handleExitFullScreen: function _handleExitFullScreen() {
      this.getModel("app").setProperty("/layout", "TwoColumnsMidExpanded");
    },
    /**
     * Handle key row selection
     */
    onKeyMetricsRowSelect: function _onKeyMetricsRowSelect(event) {
      const selectedRow = event.getParameter("rowContext");
      if (selectedRow) {
        const metric = selectedRow.getObject();
        const cacheName = this.getView().getElementBinding().getBoundContext().getProperty("name");

        // Navigate to single metric view
        this.getRouter().navTo("singleKeyMetric", {
          cache: cacheName,
          keyMetricId: metric.ID
        });

        // Set layout to three columns
        this.getModel("app").setProperty("/layout", "ThreeColumnsEndExpanded");
      }
    },
    /**
     * Refresh key data
     */
    onRefreshKeyMetricsData: async function _onRefreshKeyMetricsData() {
      await this.loadKeyMetricsData(true);
    },
    onRefreshMetricsData: async function _onRefreshMetricsData() {
      await this.loadStatistics(true);
    },
    onShowKeyMetricsMetadata: async function _onShowKeyMetricsMetadata(event) {
      const context = event.getSource().getBindingContext();
      const saveJson = json => {
        try {
          return JSON.stringify(JSON.parse(json), null, 2);
        } catch (error) {
          return json;
        }
      };
      const localData = new JSONModel({
        metadata: saveJson(context.getProperty("metadata")),
        subject: saveJson(context.getProperty("subject")),
        query: saveJson(context.getProperty("query")),
        cacheOptions: saveJson(context.getProperty("cacheOptions")),
        keyName: context.getProperty("keyName")
      });
      const e = s => Cache.escapeFragmentXml(s);
      const tabMeta = e(await this.i18nText("keyTabMetadata"));
      const tabSub = e(await this.i18nText("keyTabSubject"));
      const tabQ = e(await this.i18nText("keyTabQuery"));
      const tabCo = e(await this.i18nText("keyTabCacheOptions"));
      const fragment = await Fragment.load({
        definition: `<core:FragmentDefinition xmlns:core="sap.ui.core" xmlns:mvc="sap.ui.core.mvc" xmlns="sap.m" xmlns:form="sap.ui.layout.form">
                <Popover title="{localData>/keyName}" placement="Bottom" contentWidth="30rem">
                    <content>
                        <IconTabBar>
                            <items>
                                <IconTabFilter text="${tabMeta}">
                                    <content>
                                        <TextArea value="{localData>/metadata}" rows="20" width="100%" editable="false" />
                                    </content>
                                </IconTabFilter>
                                <IconTabFilter text="${tabSub}" >
                                    <content>
                                        <TextArea value="{localData>/subject}" rows="20" width="100%" editable="false" />
                                    </content>
                                </IconTabFilter>
                                <IconTabFilter text="${tabQ}" >
                                    <content>
                                        <TextArea value="{localData>/query}" rows="20" width="100%" editable="false" />
                                    </content>
                                </IconTabFilter>
                                <IconTabFilter text="${tabCo}" >
                                    <content>
                                        <TextArea value="{localData>/cacheOptions}" rows="20" width="100%" editable="false" />
                                    </content>
                                </IconTabFilter>
                                </items>
                        </IconTabBar>
                    </content>
                </Popover>
            </core:FragmentDefinition>`,
        controller: this
      });
      const popover = fragment;
      popover.setModel(localData, "localData");
      popover.openBy(event.getSource());
    },
    /**
     * Clear statistics
     */
    onClearMetrics: async function _onClearMetrics() {
      const cacheContext = this.getView().getElementBinding().getBoundContext();
      if (!cacheContext) {
        return;
      }
      try {
        const model = this.getModel();
        const action = model.bindContext(`plugin.cds_caching.CachingApiService.clearMetrics(...)`, cacheContext);
        await action.invoke();
        MessageToast.show(await this.i18nText("msgMetricsCleared"));

        // Refresh the data
        await this.onRefreshMetricsData();
      } catch (error) {
        console.error("Error clearing metrics:", error);
        MessageBox.error(await this.i18nText("msgFailedClearMetrics"));
      }
    },
    /**
     * Clear key metrics
     */
    onClearKeyMetrics: async function _onClearKeyMetrics() {
      const cacheContext = this.getView().getElementBinding().getBoundContext();
      if (!cacheContext) {
        return;
      }
      try {
        const model = this.getModel();
        const action = model.bindContext(`plugin.cds_caching.CachingApiService.clearKeyMetrics(...)`, cacheContext);
        await action.invoke();
        MessageToast.show(await this.i18nText("msgKeyMetricsCleared"));

        // Refresh the data
        await this.onRefreshKeyMetricsData();
      } catch (error) {
        console.error("Error clearing key metrics:", error);
        MessageBox.error(await this.i18nText("msgFailedClearKeyMetrics"));
      }
    }
  });
  Cache.escapeFragmentXml = function escapeFragmentXml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  };
  return Cache;
});
//# sourceMappingURL=Cache-dbg.controller.js.map
