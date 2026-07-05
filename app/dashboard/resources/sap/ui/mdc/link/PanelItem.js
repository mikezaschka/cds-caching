/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/core/Element"],e=>{"use strict";const t=e.extend("sap.ui.mdc.link.PanelItem",{metadata:{library:"sap.ui.mdc",properties:{text:{type:"string"},description:{type:"string"},href:{type:"string"},internalHref:{type:"string",defaultValue:null},target:{type:"string",defaultValue:undefined},icon:{type:"string"},visible:{type:"boolean",defaultValue:true},visibleChangedByUser:{type:"boolean"}}}});t.prototype.getJson=function(){return{id:this.getId(),text:this.getText(),description:this.getDescription(),href:this.getHref(),internalHref:this.getInternalHref(),icon:this.getIcon(),target:this.getTarget(),visible:this.getVisible(),visibleChangedByUser:this.getVisibleChangedByUser()}};return t});
//# sourceMappingURL=PanelItem.js.map