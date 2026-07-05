/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/mdc/valuehelp/base/Content","sap/ui/mdc/enums/ConditionValidated"],(e,t)=>{"use strict";const a=e.extend("sap.ui.mdc.valuehelp.base.ListContent",{metadata:{library:"sap.ui.mdc",properties:{caseSensitive:{type:"boolean",defaultValue:false},useFirstMatch:{type:"boolean",group:"Behavior",defaultValue:true},useAsValueHelp:{type:"boolean",group:"Behavior",defaultValue:true}},aggregations:{},events:{}}});a.prototype.init=function(){e.prototype.init.apply(this,arguments);this._oObserver.observe(this,{properties:["caseSensitive"]})};a.prototype.observeChanges=function(t){if(t.name==="caseSensitive"){this.handleFilterValueUpdate(t)}e.prototype.observeChanges.apply(this,arguments)};a.prototype.getCount=function(e){let a=0;for(const i of e){if(i.isEmpty!==true&&i.validated===t.Validated){a++}}return a};return a});
//# sourceMappingURL=ListContent.js.map