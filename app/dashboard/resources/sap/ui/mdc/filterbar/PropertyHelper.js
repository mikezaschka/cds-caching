/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["../util/PropertyHelper"],e=>{"use strict";const t=e.extend("sap.ui.mdc.filterbar.PropertyHelper",{constructor:function(t,r){e.call(this,t,r,{required:{type:"boolean"},hiddenFilter:{type:"boolean"}})}});t.prototype.prepareProperty=function(t,r){if(!t.typeConfig){const e=this.getParent();if(e&&e._oDelegate){const r=e._oDelegate.getTypeMap(e);try{t.typeConfig=r.getTypeConfig(t.dataType,t.formatOptions,t.constraints)}catch(e){}}}e.prototype.prepareProperty.apply(this,arguments)};return t});
//# sourceMappingURL=PropertyHelper.js.map