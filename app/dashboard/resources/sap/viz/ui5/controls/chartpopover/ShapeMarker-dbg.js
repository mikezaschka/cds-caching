/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define([
	'sap/ui/core/Control',
	'sap/ui/core/theming/Parameters',
	'../common/utils/SelectionDetailUtil'
],
    function(Control, Parameters, SelectionDetailUtil) {
        "use strict";

        var ShapeMarker = Control.extend('sap.viz.ui5.controls.chartpopover.ShapeMarker', {
            metadata: {
                library: "sap.viz",
                properties: {
                    'type': 'string',
                    'color': 'string',
                    'markerSize': 'int',
                    'showWithLine': 'string',
                    'lineInfo': 'object',
                    'stroke': 'object',
                    'pattern': 'string'
                }
            },

            renderer: {
                apiVersion: 2,
                render: function(oRm, oControl) {
                    var markerSize = oControl.getMarkerSize() ? oControl.getMarkerSize() : 10;
                    var posX = markerSize / 2,
                        posY = posX,
                        width = markerSize,
                        height = markerSize;
                    if (oControl._isShowWithLine()) {
                        posX = markerSize;
                        width = markerSize * 2;

                        markerSize = 6;
                    }
                    var props = {
                        rx: markerSize / 2,
                        ry: markerSize / 2,
                        type: oControl.getType(),
                        borderWidth: 0
                    };
                    oRm.openStart('div').openEnd();
                    oRm.openStart('svg')
                        .attr("width", width + 'px')
                        .attr("height", height + 'px')
                        .attr("focusable", "false")
                        .openEnd();
                    if (oControl._isShowWithLine()) {
                        var lineInfo = oControl.getLineInfo(),
                            lineColor = Parameters.get({name: [lineInfo.lineColor], callback: function() {}});
                        if (!lineColor) {
                            lineColor = lineInfo.lineColor ? lineInfo.lineColor : oControl.getColor();
                        }

                        if (lineInfo.lineType === 'dotted' || lineInfo.lineType === 'dash') {
                            oRm.openStart("line")
                                .attr("x1", 0)
                                .attr("y1", posY)
                                .attr("x2", width)
                                .attr("y2", posY)
                                .attr("stroke-width", 2)
                                .attr("stroke-dasharray", '5, 3');
                        } else if (lineInfo.lineType === 'dot') {
                            var pointCount = Math.floor(width / 2);
                            pointCount = pointCount & 1 ? pointCount : pointCount - 1;
                            if (pointCount < 3) {
                                pointCount = 3;
                            }
                            var lineWidth = width / pointCount;
                            oRm.openStart("line")
                                .attr("x1", (lineWidth / 2))
                                .attr("y1", posY)
                                .attr("x2", width)
                                .attr("y2", posY)
                                .attr("stroke-dasharray", "0," + (lineWidth * 2))
                                .attr("stroke-width", lineWidth)
                                .attr("stroke-linecap", 'round');
                        } else {
                            oRm.openStart("line")
                                .attr("x1", 0)
                                .attr("y1", posY)
                                .attr("x2", width)
                                .attr("y2", posY)
                                .attr("stroke-width", 2);
                        }
                        oRm.attr("stroke", lineColor);
                        oRm.openEnd().close("line");
                    }
                    if (props.type) {
                        oRm.openStart("path").attr("d", SelectionDetailUtil.generateShapePath(props));
                        var pattern = oControl.getPattern();
                        if (!pattern) {
                            oRm.attr("fill", oControl.getColor());
                        } else if (pattern === 'noFill') {
                            var fColor = Parameters.get({name: ["sapUiChartBackgroundColor"], callback: function() {}});
                            if (fColor === 'transparent') {
                                fColor = "white";
                            }
                            oRm.attr("fill", fColor);
                            oRm.attr("stroke", oControl.getColor());
                            oRm.attr("stroke-width", "1px");
                        } else {
                            oRm.attr("fill", pattern);
                        }


                        oRm.attr("transform", "translate(" + posX + "," + posY + ")");
                        oRm.openEnd().close("path");
                    }
                    oRm.close('svg');
                    oRm.close('div');
                }
            }
        });

        ShapeMarker.prototype._isShowWithLine = function() {
            return (this.getShowWithLine() === 'line') && this.getLineInfo();
        };



        return ShapeMarker;
    });
