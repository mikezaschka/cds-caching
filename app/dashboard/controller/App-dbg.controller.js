sap.ui.define(["sap/m/MessageBox", "./BaseController", "sap/m/MessageToast"], function (MessageBox, __BaseController, MessageToast) {
  "use strict";

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule && typeof obj.default !== "undefined" ? obj.default : obj;
  }
  const BaseController = _interopRequireDefault(__BaseController);
  /**
   * @namespace cds.plugin.caching.dashboard.controller
   */
  const App = BaseController.extend("cds.plugin.caching.dashboard.controller.App", {
    onInit: function _onInit() {
      // apply content density mode to root view
      this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
    },
    onSelectionChange: function _onSelectionChange(oEvent) {
      const key = oEvent.getParameter("selectedKey");
      this.getRouter().navTo(key);
    },
    /**
     * Handle cache selection change
     */
    onCacheChange: async function _onCacheChange() {
      const selectedCache = this.getModel("app").getProperty("/selectedCache");
      if (selectedCache) {
        await this.loadRuntimeConfiguration(selectedCache);
      }
    },
    /**
     * Load runtime configuration for the selected cache
     */
    loadRuntimeConfiguration: async function _loadRuntimeConfiguration(cacheName) {
      try {
        const config = await this.statisticsService.getRuntimeConfiguration(cacheName);
        this.getModel("app").setProperty("/enableStatistics", config.enableStatistics);
        this.getModel("app").setProperty("/enableKeyTracking", config.enableKeyTracking);
      } catch (error) {
        console.error("Error loading runtime configuration:", error);
        // Set defaults if loading fails
        this.getModel("app").setProperty("/enableStatistics", false);
        this.getModel("app").setProperty("/enableKeyTracking", false);
      }
    },
    /**
     * Handle statistics enable/disable switch change
     */
    onEnableStatisticsChange: async function _onEnableStatisticsChange(oEvent) {
      const enabled = oEvent.getParameter("state");
      const cacheName = this.getModel("app").getProperty("/selectedCache");
      if (!cacheName) {
        MessageBox.warning(await this.i18nText("msgNoCacheSelected"));
        // Revert the switch
        this.getModel("app").setProperty("/enableStatistics", !enabled);
        return;
      }
      try {
        // Show loading state
        MessageToast.show(await this.i18nText("msgUpdatingStatsConfig"));
        const success = await this.statisticsService.setStatisticsEnabled(cacheName, enabled);
        if (success) {
          MessageToast.show(await this.i18nText(enabled ? "msgStatsEnabled" : "msgStatsDisabled"));
          // Reload the configuration to reflect the change
          await this.loadRuntimeConfiguration(cacheName);
        } else {
          MessageToast.show(await this.i18nText("msgFailedUpdateStatsConfig"));
          // Revert the switch
          this.getModel("app").setProperty("/enableStatistics", !enabled);
        }
      } catch (error) {
        console.error("Error updating statistics configuration:", error);
        MessageToast.show(await this.i18nText("msgErrorUpdateStatsConfig"));
        // Revert the switch
        this.getModel("app").setProperty("/enableStatistics", !enabled);
      }
    },
    /**
     * Handle key tracking enable/disable switch change
     */
    onEnableKeyTrackingChange: async function _onEnableKeyTrackingChange(oEvent) {
      const enabled = oEvent.getParameter("state");
      const cacheName = this.getModel("app").getProperty("/selectedCache");
      if (!cacheName) {
        MessageBox.warning(await this.i18nText("msgNoCacheSelected"));
        // Revert the switch
        this.getModel("app").setProperty("/enableKeyTracking", !enabled);
        return;
      }
      try {
        // Show loading state
        MessageToast.show(await this.i18nText("msgUpdatingKeyTracking"));
        const success = await this.statisticsService.setKeyTrackingEnabled(cacheName, enabled);
        if (success) {
          MessageToast.show(await this.i18nText(enabled ? "msgKeyTrackingEnabled" : "msgKeyTrackingDisabled"));
          // Reload the configuration to reflect the change
          await this.loadRuntimeConfiguration(cacheName);
        } else {
          MessageToast.show(await this.i18nText("msgFailedKeyTracking"));
          // Revert the switch
          this.getModel("app").setProperty("/enableKeyTracking", !enabled);
        }
      } catch (error) {
        console.error("Error updating key tracking configuration:", error);
        MessageToast.show(await this.i18nText("msgErrorKeyTracking"));
        // Revert the switch
        this.getModel("app").setProperty("/enableKeyTracking", !enabled);
      }
    },
    /**
     * Persist statistics to database
     */
    onPersistStatistics: async function _onPersistStatistics() {
      try {
        const cacheName = this.getModel("app").getProperty("/selectedCache");
        if (!cacheName) {
          MessageBox.warning(await this.i18nText("msgNoCacheSelected"));
          return;
        }
        const success = await this.statisticsService.persistStatistics(cacheName);
        if (success) {
          MessageToast.show(await this.i18nText("msgStatsPersisted"));
        } else {
          MessageToast.show(await this.i18nText("msgFailedPersistStats"));
        }
      } catch (error) {
        console.error("Error persisting statistics:", error);
        MessageToast.show(await this.i18nText("msgErrorPersistStats"));
      }
    }
  });
  return App;
});
//# sourceMappingURL=App-dbg.controller.js.map
