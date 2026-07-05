/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define([
    'sap/ui/core/Control',
    './ContentPanel'
], function(
    Control,
    ContentPanel
) {
    "use strict";

    var TooltipContainer = Control.extend("sap.viz.ui5.controls.charttooltip.TooltipContainer", {
        metadata: {
            library: "sap.viz",
            properties: {}
        },

        renderer: {
            apiVersion: 2,
            render: function(oRm, oControl) {
                oRm.openStart('div', oControl)
                    .class("viz-controls-chartTooltip")
                    .openEnd()
                    .renderControl(oControl._oPanel)
                    .close('div');
            }
        }
    });

    TooltipContainer.prototype.init = function() {
        this._oPanel = new ContentPanel();
    };

    TooltipContainer.prototype.setContent = function(data) {
        this._oPanel.setContent(data);
    };

    TooltipContainer.prototype.exit = function() {
        if (this._oPanel) {
            this._oPanel.destroy();
            this._oPanel = null;
        }
    };

    return TooltipContainer;
});
