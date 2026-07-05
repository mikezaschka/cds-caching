/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/viz/library","sap/viz/ui5/core/BaseStructuredType"],function(e,t){"use strict";var a=t.extend("sap.viz.ui5.types.Heatmap",{metadata:{library:"sap.viz",properties:{startColor:{type:"string",defaultValue:"#C2E3A9"},endColor:{type:"string",defaultValue:"#73C03C"},colorPalette:{type:"string[]"},legendValues:{type:"int[]"},formatRules:{type:"object[]"}},aggregations:{border:{type:"sap.viz.ui5.types.Heatmap_border",multiple:false},animation:{type:"sap.viz.ui5.types.Heatmap_animation",multiple:false},toolTip:{type:"sap.viz.ui5.types.Heatmap_tooltip",multiple:false,deprecated:true}}}});return a});
//# sourceMappingURL=Heatmap.js.map