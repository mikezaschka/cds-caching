sap.ui.define(["sap/ui/core/mvc/Controller", "sap/ui/core/UIComponent", "sap/ui/core/routing/History"], function (Controller, UIComponent, History) {
  "use strict";

  /**
   * @namespace cds.plugin.caching.dashboard.controller
   */
  const BaseController = Controller.extend("cds.plugin.caching.dashboard.controller.BaseController", {
    onInit: function _onInit() {},
    /**
     * Convenience method for accessing the component of the controller's view.
     * @returns The component of the controller's view
     */
    getOwnerComponent: function _getOwnerComponent() {
      return Controller.prototype.getOwnerComponent.call(this);
    },
    /**
     * Convenience method to get the components' router instance.
     * @returns The router instance
     */
    getRouter: function _getRouter() {
      return UIComponent.getRouterFor(this);
    },
    /**
     * Convenience method for getting the i18n resource bundle of the component.
     * @returns {Promise<sap.base.i18n.ResourceBundle>} The i18n resource bundle of the component
     */
    getResourceBundle: function _getResourceBundle() {
      const oModel = this.getOwnerComponent().getModel("i18n");
      return oModel.getResourceBundle();
    },
    /**
     * Convenience method for getting the view model by name in every controller of the application.
     * @param [sName] The model name
     * @returns The model instance
     */
    getModel: function _getModel(sName) {
      return this.getView().getModel(sName);
    },
    /**
     * Convenience method for setting the view model in every controller of the application.
     * @param oModel The model instance
     * @param [sName] The model name
     * @returns The current base controller instance
     */
    setModel: function _setModel(oModel, sName) {
      this.getView().setModel(oModel, sName);
      return this;
    },
    /**
     * Convenience method for triggering the navigation to a specific target.
     * @public
     * @param sName Target name
     * @param [oParameters] Navigation parameters
     * @param [bReplace] Defines if the hash should be replaced (no browser history entry) or set (browser history entry)
     */
    navTo: function _navTo(sName, oParameters, bReplace) {
      this.getRouter().navTo(sName, oParameters, undefined, bReplace);
    },
    /**
     * Convenience event handler for navigating back.
     * It there is a history entry we go one step back in the browser history
     * If not, it will replace the current entry of the browser history with the main route.
     */
    onNavBack: function _onNavBack() {
      const sPreviousHash = History.getInstance().getPreviousHash();
      if (sPreviousHash !== undefined) {
        window.history.go(-1);
      } else {
        this.getRouter().navTo("main", {}, undefined, true);
      }
    }
  });
  return BaseController;
});
//# sourceMappingURL=BaseController-dbg.js.map
