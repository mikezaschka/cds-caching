/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/base/Log"],function(t){"use strict";function e(t,e,s){this._type=t;this._name=e;this._message=s}e.prototype.display=function(){if(this._type==="error"){t.error("[Analytical Chart] "+this._name,this._message)}};return e});
//# sourceMappingURL=ChartLog.js.map