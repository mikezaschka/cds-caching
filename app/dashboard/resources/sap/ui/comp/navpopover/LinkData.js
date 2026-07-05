/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/ui/comp/library","sap/ui/mdc/link/LinkItem"],function(e,t){"use strict";var i=t.extend("sap.ui.comp.navpopover.LinkData",{metadata:{library:"sap.ui.comp",properties:{target:{type:"string",defaultValue:null},visible:{type:"boolean",defaultValue:true},isSuperiorAction:{type:"boolean"},visibleChangedByUser:{type:"boolean"}}}});i.prototype.getJson=function(){return{key:this.getKey(),href:this.getHref(),internalHref:this.getInternalHref(),text:this.getText(),target:this.getTarget(),description:this.getDescription(),visible:this.getVisible(),press:this.getPress(),isSuperiorAction:this.getIsSuperiorAction()}};i.convert2Json=function(e){return e.map(function(e){return e.getJson()})};i.prototype.setIsSuperiorAction=function(e){return this.setInitiallyVisible(e)};return i});
//# sourceMappingURL=LinkData.js.map