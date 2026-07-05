/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/Log"],e=>{"use strict";return{getUShellContainer:function(){return sap.ui.require("sap/ushell/Container")},getServiceAsync:function(i){const r=this.getUShellContainer();if(!r){return Promise.resolve(null)}switch(i){case"CrossApplicationNavigation":e.error("sap.ui.mdc.link.Factory: tried to retrieve deprecated service 'CrossApplicationNavigation', please use 'Navigation' instead!");return r.getServiceAsync("CrossApplicationNavigation");case"Navigation":return r.getServiceAsync("Navigation");case"URLParsing":return r.getServiceAsync("URLParsing");default:return Promise.resolve(null)}}}});
//# sourceMappingURL=Factory.js.map