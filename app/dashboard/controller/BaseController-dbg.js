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
     * @returns The i18n resource bundle of the component
     */
    getResourceBundle: function _getResourceBundle() {
      const model = this.getOwnerComponent().getModel("i18n");
      return model.getResourceBundle();
    },
    /**
     * Returns a translated string from the i18n bundle (ResourceModel is async).
     */
    i18nText: async function _i18nText(key, args) {
      const bundle = await this.getResourceBundle();
      return args && args.length ? bundle.getText(key, args) : bundle.getText(key);
    },
    /**
     * Convenience method for getting the view model by name in every controller of the application.
     * @param name The model name
     * @returns The model instance
     */
    getModel: function _getModel(name) {
      return this.getView().getModel(name);
    },
    /**
     * Returns the application JSON model.
     */
    getAppModel: function _getAppModel() {
      return this.getModel("app");
    },
    /**
     * Returns the default OData V4 model.
     */
    getODataModel: function _getODataModel() {
      return this.getModel();
    },
    /**
     * Convenience method for setting the view model in every controller of the application.
     * @param model The model instance
     * @param name The model name
     * @returns The current base controller instance
     */
    setModel: function _setModel(model, name) {
      this.getView().setModel(model, name);
      return this;
    },
    /**
     * Convenience method for triggering the navigation to a specific target.
     * @param name Target name
     * @param parameters Navigation parameters
     * @param replace Defines if the hash should be replaced (no browser history entry) or set (browser history entry)
     */
    navTo: function _navTo(name, parameters, replace) {
      this.getRouter().navTo(name, parameters, undefined, replace);
    },
    /**
     * Convenience event handler for navigating back.
     * It there is a history entry we go one step back in the browser history
     * If not, it will replace the current entry of the browser history with the main route.
     */
    onNavBack: function _onNavBack() {
      const previousHash = History.getInstance().getPreviousHash();
      if (previousHash !== undefined) {
        window.history.go(-1);
      } else {
        this.getRouter().navTo("main", {}, undefined, true);
      }
    }
  });
  return BaseController;
});
//# sourceMappingURL=BaseController-dbg.js.map
