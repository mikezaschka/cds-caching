sap.ui.define(["./BaseController"], function (__BaseController) {
  "use strict";

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule && typeof obj.default !== "undefined" ? obj.default : obj;
  }
  const BaseController = _interopRequireDefault(__BaseController);
  /**
   * @namespace cds.plugin.caching.dashboard.controller
   */
  const Main = BaseController.extend("cds.plugin.caching.dashboard.controller.Main", {
    onInit: function _onInit() {
      this.getRouter().getRoute("main").attachPatternMatched(this.onRouteMatched, this);
    },
    onRouteMatched: function _onRouteMatched(event) {
      // Set layout to one column for main view
      this.getModel("app").setProperty("/layout", "OneColumn");
      this.getView().byId("cachesList").getBinding("items").refresh();
    },
    onCacheSelect: function _onCacheSelect(event) {
      const cache = event.getParameter("listItem").getBindingContext().getProperty("name");
      this.getRouter().navTo("cache", {
        cache: cache
      });
    },
    onRefresh: function _onRefresh() {
      this.getView().byId("cachesList").getBinding("items").refresh();
    }
  });
  return Main;
});
//# sourceMappingURL=Main-dbg.controller.js.map
