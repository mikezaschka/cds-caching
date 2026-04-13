sap.ui.define(["sap/ui/core/UIComponent", "./model/models", "sap/ui/Device", "./model/formatter", "sap/ui/model/json/JSONModel"], function (UIComponent, __models, Device, __formatter, JSONModel) {
  "use strict";

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule && typeof obj.default !== "undefined" ? obj.default : obj;
  }
  const models = _interopRequireDefault(__models);
  const formatter = _interopRequireDefault(__formatter);
  /**
   * @namespace cds.plugin.caching.dashboard
   */
  const Component = UIComponent.extend("cds.plugin.caching.dashboard.Component", {
    metadata: {
      manifest: "json",
      interfaces: ["sap.ui.core.IAsyncContentCreation"]
    },
    init: function _init() {
      // call the base component's init function
      UIComponent.prototype.init.call(this);

      // create the device model
      this.setModel(models.createDeviceModel(), "device");
      this.setModel(new JSONModel({
        selectedCache: null,
        selectedTab: "main",
        layout: "OneColumn"
      }), "app");

      // create the formatter model
      this.setModel(new JSONModel(formatter), "formatter");

      // create the views based on the url/hash
      this.getRouter().initialize();
    },
    /**
     * This method can be called to determine whether the sapUiSizeCompact or sapUiSizeCozy
     * design mode class should be set, which influences the size appearance of some controls.
     * @public
     * @returns css class, either 'sapUiSizeCompact' or 'sapUiSizeCozy' - or an empty string if no css class should be set
     */
    getContentDensityClass: function _getContentDensityClass() {
      if (this.contentDensityClass === undefined) {
        // check whether FLP has already set the content density class; do nothing in this case
        if (document.body.classList.contains("sapUiSizeCozy") || document.body.classList.contains("sapUiSizeCompact")) {
          this.contentDensityClass = "";
        } else if (!Device.support.touch) {
          // apply "compact" mode if touch is not supported
          this.contentDensityClass = "sapUiSizeCompact";
        } else {
          // "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
          this.contentDensityClass = "sapUiSizeCozy";
        }
      }
      return this.contentDensityClass;
    }
  });
  return Component;
});
//# sourceMappingURL=Component-dbg.js.map
