/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/core/Element"],t=>{"use strict";const e=t.extend("sap.ui.mdc.filterbar.IFilterContainer",{metadata:{library:"sap.ui.mdc"}});e.prototype.init=function(){t.prototype.init.apply(this,arguments);this.oLayout=null};e.prototype.getInner=function(){return this.oLayout};e.prototype.insertFilterField=function(t,e){};e.prototype.removeFilterField=function(t){};e.prototype.getFilterFields=function(){};e.prototype.exit=function(){t.prototype.exit.apply(this,arguments);if(this.oLayout){this.oLayout.destroy();this.oLayout=null}};return e});
//# sourceMappingURL=IFilterContainer.js.map