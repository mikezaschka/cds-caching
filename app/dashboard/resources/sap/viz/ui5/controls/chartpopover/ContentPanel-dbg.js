/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define([
	'./ShapeMarker',
	'sap/ui/core/Control',
	'sap/ui/layout/form/SimpleForm',
	'sap/ui/layout/Grid',
	'sap/m/Text',
	'sap/m/ObjectNumber',
	'sap/m/Label',
	'sap/ui/core/library',
	'../common/utils/ContentUtil',
	'../common/utils/SelectionDetailUtil',
	'sap/ui/layout/form/ResponsiveGridLayout' // indirectly used by SimpleForm
],
function(
	ShapeMarker,
	Control,
	SimpleForm,
	Grid,
	Text,
	ObjectNumber,
	Label,
	coreLibrary,
	ContentUtil,
	SelectionDetailUtil
) {
    "use strict";

    // shortcut for sap.ui.core.TextAlign
    var TextAlign = coreLibrary.TextAlign;

    var ContentPanel = Control.extend('sap.viz.ui5.controls.chartpopover.ContentPanel', {
        metadata : {
            library: "sap.viz",
            properties : {
                'showLine' : 'boolean'
            },
            publicMethods : ["setContentData"]
        },

        renderer : {
            apiVersion: 2,
            render : function(oRm, oControl) {
                oRm.openStart("div", oControl)
                    .class("viz-controls-chartPopover-contentPanel")
                    .attr("aria-labelledby", oControl._oDimLabel.getId() + " " + oControl._oForm.getId())
                    .attr('tabindex', -1)
                    .openEnd();
                oRm.renderControl(oControl._oShapeLabel);
                oRm.renderControl(oControl._oPanel);
                oRm.close("div");
            }
        }
    });

    ContentPanel.prototype.init = function() {
        this._measureItemsLen = 0;
        this._maxMeasureLableLen = 15;
        this._maxMeasureValueLen = 12;

        this._oShapeLabel = new ShapeMarker(this._createId('vizShapeMarker'), {
        }).addStyleClass('viz-controls-chartPopover-dimension-marker');
        this._oDimLabel = new Text(this._createId('vizDimensionLabel'), {
        }).addStyleClass('viz-controls-chartPopover-dimension-label');

        this._oForm = new SimpleForm({
            editable : false,
            maxContainerCols : 2,
            layout:"ResponsiveGridLayout",
            labelSpanL: 6,
            labelSpanM: 6,
            labelSpanS: 6,
            emptySpanL: 0,
            emptySpanM: 0,
            emptySpanS: 0,
            columnsL: 2,
            columnsM: 2,
            content: [
            ]
        });
        this._oPanel = new Grid({
            width: '100%',
            defaultSpan:"L12 M12 S12",
            content : [
                this._oDimLabel,
                this._oForm
            ]
        }).addStyleClass('viz-controls-chartPopover-Vlt');

    };

    ContentPanel.prototype.setContentData = function(data) {

        this._measureItemsLen = 0;

        var values = data.val, dims = '';
        if (values) {
            this._oForm.removeAllContent();
            var isLongMode = false;

            var results = ContentUtil.setContent("popover", data);

            var items = results.items;
            dims = results.dims;
            isLongMode = results.isLongMode;

            for (var i = 0; i < items.length; i++) {
                this._renderLabels(isLongMode, items[i], data.isTimeSeries);
            }

            var isPeriodicWaterfall = function(data) {
                var result = false;
                if (data.selectByTimeAxisGroup && data.val) {
                    var measureCount = 0;
                    for (var i = 0; i < data.val.length; i++) {
                        if (data.val[i].type === 'Measure') {
                            measureCount++;
                        }
                    }
                    if (measureCount > 1) {
                        result = true;
                    }
                }
                return result;
            };

            if (!isPeriodicWaterfall(data) && typeof data.color === 'string') {
                var markerSize = this._oDimLabel.$().css('margin-left');
                if (markerSize) {
                    markerSize = parseInt(markerSize.substr(0, markerSize.length - 2));
                    this._oShapeLabel.setMarkerSize(markerSize);
                }
                this._oShapeLabel.setColor(data.color).setType((data.shape ? data.shape : 'square'));
                if (this.getShowLine()) {
                    this._oShapeLabel.setShowWithLine(data.type).setLineInfo(data.lineInfo);
                } else {
                    this._oShapeLabel.setShowWithLine(undefined);
                }
                if (data.stroke && data.stroke.visible) {
                    //Draw marker with stroke
                    this._oShapeLabel.setStroke(data.stroke);
                }
            } else {
                this._oShapeLabel.setType(null);
                this._oShapeLabel.setShowWithLine(undefined);
            }

            if (data.pattern) {
                this._oShapeLabel.setPattern(data.pattern);
            } else {
                this._oShapeLabel.setPattern(null);
            }

            if (dims && dims.length > 0) {
                this._oDimLabel.setVisible(true);
                this._oDimLabel.setText(dims);
            } else {
                this._oDimLabel.setVisible(false);
            }

            this._measureItemsLen = data.val.length;
            //when it has a dimension label, the padding-left of form is:20px-8px+0.688rem-4px=1.188rem
            //20px: length of shapeMarker,8px: padding-left of grid,4px: padding-left of dimension label.
            if (this._oShapeLabel._isShowWithLine()) {
                this._oForm.addStyleClass('viz-controls-chartPopover-measure-simpleForm');
            } else {
                this._oForm.removeStyleClass('viz-controls-chartPopover-measure-simpleForm');
            }
            //when it doesnt't have a dimension label, the padding-left of form is:0.688-4px
            if (!this._oDimLabel.getVisible()){
                this._oForm.addStyleClass('viz-controls-chartPopover-measure-simpleForm-withoutDimensionLabel');
            } else {
                this._oForm.removeStyleClass('viz-controls-chartPopover-measure-simpleForm-withoutDimensionLabel');
            }
        }
    };

    ContentPanel.prototype._renderLabels = function(isLongMode, item, isTimeSeries){
        var valueLabel;
        if (isLongMode) {
            this._oForm.setLabelSpanS(12);
            if (item.name !== '') {
                this._oForm.addContent(new Text({
                    text: item.name
                }).addStyleClass('viz-controls-chartPopover-measure-labels viz-controls-chartPopover-measure-labels-wrapper-name'));
            }
            valueLabel = new ObjectNumber({
                number: item.value,
                unit: item.unit,
                textAlign: TextAlign.Begin
            }).addStyleClass('viz-controls-chartPopover-measure-labels viz-controls-chartPopover-measure-labels-wrapper-value');
            this._oForm.addContent(valueLabel);
            if (isTimeSeries && (item.name === '')) {
                valueLabel.addStyleClass('viz-controls-chartPopover-timeDayDimValue');
            }
        } else {
            this._oForm.setLabelSpanS(6);
            this._oForm.addContent(new Label({
                text: item.name
            }).addStyleClass('viz-controls-chartPopover-measure-labels viz-controls-chartPopover-measure-name'));
            if (item.value !== null) {
                valueLabel = new ObjectNumber({
                    number: item.value,
                    unit: item.unit,
                    textAlign: TextAlign.End
                }).addStyleClass('viz-controls-chartPopover-measure-labels viz-controls-chartPopover-measure-value');
            } else {
                valueLabel = new ObjectNumber({
                    number: this._getNoValueLabel(),
                    textAlign: TextAlign.End
                }).addStyleClass('viz-controls-chartPopover-measure-labels viz-controls-chartPopover-measure-value');
            }

            if (isTimeSeries && (item.name === '')) {
                //Time axis and min level is second.
                valueLabel.addStyleClass('viz-controls-chartPopover-timeDayValue');
            }
            this._oForm.addContent(valueLabel);
        }
    };

    ContentPanel.prototype.isMultiSelected = function() {
        return this._measureItemsLen === 0;
    };

    /**
     * Creates an id for an Element prefixed with the control id
     *
     * @return {string} id
     * @public
     */
    ContentPanel.prototype._createId = function(sId) {
        return this.getId() + "-" + sId;
    };

    ContentPanel.prototype._getNoValueLabel = function(){
        return sap.viz.extapi.env.Language.getResourceString("IDS_ISNOVALUE");
    };

    ContentPanel.prototype.exit = function(sId) {
        if (this._oForm) {
            this._oForm.destroy();
            this._oForm = null;
        }

        if (this._oShapeLabel) {
            this._oShapeLabel.destroy();
            this._oShapeLabel = null;
        }

        if (this._oDimLabel) {
            this._oDimLabel.destroy();
            this._oDimLabel = null;
        }

        if (this._oPanel) {
            this._oPanel.destroy();
            this._oPanel = null;
        }
    };

    return ContentPanel;
});
