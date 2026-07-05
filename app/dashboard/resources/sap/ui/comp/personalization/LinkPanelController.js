/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/ui/mdc/p13n/subcontroller/LinkPanelController","sap/ui/core/Lib","sap/m/MessageBox"],(e,t,n)=>{"use strict";const o=e.extend("sap.ui.comp.personalization.LinkPanelController",{});o.prototype.getSelectorForReset=function(){return this.getAdaptationControl()};o.prototype.getSelectorsForHasChanges=function(){return this.getAdaptationControl()};o.prototype._createAddRemoveChange=function(e,t,n){const o=n.name;return{selectorElement:e,changeSpecificData:{changeType:t,content:{visible:t==="addLink",key:o,selector:{id:o,idIsLocal:false}}}}};o.prototype._navigate=function(e){this.getAdaptationControl().getMetadata()._oParent._oClass.navigate(e)};o.prototype.getChangeOperations=function(){return{add:"addLink",remove:"removeLink"}};return o});
//# sourceMappingURL=LinkPanelController.js.map