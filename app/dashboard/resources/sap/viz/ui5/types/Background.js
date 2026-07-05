/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/viz/library","sap/viz/ui5/core/BaseStructuredType"],function(e,a){"use strict";var t=a.extend("sap.viz.ui5.types.Background",{metadata:{library:"sap.viz",properties:{visible:{type:"boolean",defaultValue:true},drawingEffect:{type:"sap.viz.ui5.types.Background_drawingEffect",defaultValue:sap.viz.ui5.types.Background_drawingEffect.normal},direction:{type:"sap.viz.ui5.types.Background_direction",defaultValue:sap.viz.ui5.types.Background_direction.vertical},color:{type:"string",defaultValue:"transparent",deprecated:true}},aggregations:{border:{type:"sap.viz.ui5.types.Background_border",multiple:false}}}});return t});
//# sourceMappingURL=Background.js.map