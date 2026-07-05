/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/apply/_internal/flexObjects/UIChange"],function(e){"use strict";var t=e.extend("sap.ui.fl.apply._internal.flexObjects.UpdatableChange",{metadata:{aggregations:{revertInfo:{type:"sap.ui.base.ManagedObject",multiple:true,singularName:"revertInfo"}}}});t.getMappingInfo=function(){return{...e.getMappingInfo()}};t.prototype.popLatestRevertInfo=function(){var e=this.getRevertInfo().pop();this.removeRevertInfo(e);return e};t.prototype.canBeCondensed=function(){return false};return t});
//# sourceMappingURL=UpdatableChange.js.map