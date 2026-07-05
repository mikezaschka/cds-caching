/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/ui/comp/library","sap/base/Log"],function(e,n){"use strict";var i={getUShellContainer:function(){return sap.ui.require("sap/ushell/Container")},getService:function(e,i){if(!i){n.warning("sap.ui.comp.navpopover.Factory: calling getService synchronously should not be done as it's deprecated.");return null}return this.getServiceAsync(e)},getServiceAsync:function(e){const i=this.getUShellContainer();if(!i){return Promise.resolve(null)}switch(e){case"CrossApplicationNavigation":n.warning("sap.ui.comp.navpopover.Factory: Service 'CrossApplicationNavigation' should not be used as it's deprecated.");return i.getServiceAsync("CrossApplicationNavigation");case"URLParsing":return i.getServiceAsync("URLParsing");case"Navigation":return i.getServiceAsync("Navigation");default:return Promise.resolve(null)}}};return i},true);
//# sourceMappingURL=Factory.js.map