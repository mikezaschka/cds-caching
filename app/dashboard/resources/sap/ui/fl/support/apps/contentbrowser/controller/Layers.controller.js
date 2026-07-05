/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/core/mvc/Controller","sap/ui/fl/support/apps/contentbrowser/utils/ErrorUtils","sap/ui/core/UIComponent"],function(e,r,t){"use strict";return e.extend("sap.ui.fl.support.apps.contentbrowser.controller.Layers",{onLayerSelected(e){var r=e.getSource();var s=r.getBindingContextPath().substring(1);var o=this.getView().getModel("layers").getData();var a=o[s].name;var n=t.getRouterFor(this);n.navTo("LayerContentMaster",{layer:a})},handleMessagePopoverPress(e){var t=e.getSource();r.handleMessagePopoverPress(t)}})});
//# sourceMappingURL=Layers.controller.js.map