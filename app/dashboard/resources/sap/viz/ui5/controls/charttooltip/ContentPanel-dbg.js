/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define([
    'sap/ui/core/Control',
    'sap/ui/layout/VerticalLayout',
    'sap/ui/layout/HorizontalLayout',
    'sap/m/Label',
    'sap/m/Text',
    '../common/utils/ContentUtil',
    'sap/ui/core/library',
    'sap/m/ObjectNumber'
], function(
    Control,
    VerticalLayout,
    HorizontalLayout,
    Label,
    Text,
    ContentUtil,
    coreLibrary,
    ObjectNumber
) {
    "use strict";

    var ContentPanel = Control.extend("sap.viz.ui5.controls.charttooltip.ContentPanel", {
        metadata: {
            library: "sap.viz",
            properties: {}
        },

        renderer: {
            apiVersion: 2,
            render: function(oRm, oControl) {
                oRm.openStart('div', oControl)
                    .class("viz-controls-chartTooltip-contentPanel")
                    .openEnd()
                    .renderControl(oControl._oPanel)
                    .close('div');
            }
        }
    });

    ContentPanel.prototype.init = function() {
        this._oPanel = new VerticalLayout({});
    };

    ContentPanel.prototype.setContent = function(data) {

        this._oPanel.destroyContent();

        var results = ContentUtil.setContent("toolTip", data);

        var items = results.items;
        var rowspace = items.length > 1 ? true : false;

        for (var i = 0; i < items.length; i++) {
            this._renderLabels(items[i], rowspace, !!i);
        }

    };

    ContentPanel.prototype._renderLabels = function(item, rowspace, notFirst){
        var labelValue;

        var label = new Label({
            text: item.name
        });
        label.addStyleClass('viz-controls-chartTooltip-label');
        var colonLabel = new Label({
            text: ":"
        });
        colonLabel.addStyleClass("viz-controls-chartTooltip-separator");

        var itemValue = item.value;
        if (itemValue === null) {
            itemValue = this._getNoValueLabel();
        }

        if (item.type && item.type === 'dimension') {
            labelValue = new Text({
                text: itemValue
            });
            labelValue.addStyleClass('viz-controls-chartTooltip-dimension-value');
        } else if (item.type && item.type === 'measure') {
            labelValue = new ObjectNumber({
                number: itemValue,
                unit: item.unit
            });
            labelValue.addStyleClass('viz-controls-chartTooltip-measure-value');
        }

        var horizontalContent = new HorizontalLayout({
            content: [label, colonLabel, labelValue]
        });

        if (rowspace && notFirst) {
            horizontalContent.addStyleClass("sapUI5TooltipRowSpacing");
        }
        this._oPanel.addContent(horizontalContent);

    };

    ContentPanel.prototype.exit = function() {
        if (this._oPanel) {
            this._oPanel.destroy();
            this._oPanel = null;
        }
    };

    ContentPanel.prototype._getNoValueLabel = function(){
        return sap.viz.extapi.env.Language.getResourceString("IDS_ISNOVALUE");
    };

    return ContentPanel;
});
