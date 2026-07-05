/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/m/Token","sap/ui/core/Lib","sap/ui/mdc/field/TokenDisplayRenderer"],(e,t,i)=>{"use strict";const r=e.extend("sap.ui.mdc.field.TokenDisplay",{metadata:{library:"sap.ui.mdc",properties:{_delimiter:{type:"string",defaultValue:"·",visibility:"hidden"}}},renderer:i});r.prototype.init=function(){e.prototype.init.apply(this,arguments);if(!this._oResourceBundle){this._oResourceBundle=t.getResourceBundleFor("sap.ui.mdc")}this.setProperty("_delimiter",this._oResourceBundle.getText("field.SEPARATOR").trim())};r.prototype.getSelected=function(){return false};r.prototype.focus=function(){return};return r});
//# sourceMappingURL=TokenDisplay.js.map