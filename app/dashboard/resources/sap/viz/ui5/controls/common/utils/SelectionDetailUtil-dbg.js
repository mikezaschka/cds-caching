/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define([
    'sap/ui/core/theming/Parameters'
],function (Parameters) {
    "use strict";

    var SelectionDetailUtil = {};

    SelectionDetailUtil.appendShapeStrings = function (data) {
		data.forEach(function(item){
			if (item.graphicInfo) {
				item.shapeString = getShapeString(item.graphicInfo);
				delete item.graphicInfo;
			}
        });
    };

    var getShapeString = function(option){
        var color = option.color;
        if (!color){
            return '';
        }

        if (typeof color === 'object'){
            var oShape = {};
            var keys = ["v-primary", "v-additional", "v-forecast"];
            for (var ii = 0; ii < keys.length; ii++){
                var key = keys[ii];
                if (color[key] && color[key]["id"]){
                    oShape[color[key]["id"]] = getShapeString(color[key]);
                }
            }
            return oShape;
        } else if (typeof color === 'string') {
            var sShape = '';
            var markerSize = 10,
                posX = markerSize / 2,
                posY = posX,
                width = markerSize,
                height = markerSize,
                isShowLine = option.type === 'line';
            if (option.type && isShowLine) {
                posX = markerSize;
                width = markerSize * 2;
                markerSize = 6;
            }
            var props = {
                rx: markerSize / 2,
                ry: markerSize / 2,
                type: option.shape,
                borderWidth: 0
            };
            sShape = sShape + '<svg width=' + width + 'px height=' + height + 'px ' + 'focusable = false>';
            if (isShowLine) {
                var lineInfo = option.lineInfo;
                var lineColor = Parameters.get({name: [lineInfo.lineColor], callback: function() {}}) || lineInfo.lineColor || color;
                if (lineInfo.lineType === 'dotted' || lineInfo.lineType === 'dash') {
                    sShape = sShape + "<line x1 = '0' y1='" + posY + "' x2 = '" + width + "' y2 = '" + posY + "' stroke-width = '2' stroke-dasharray = '5, 3' ";
                } else if (lineInfo.lineType === 'dot') {
                    var pointCount = Math.floor(width / 2);
                    pointCount = pointCount & 1 ? pointCount : pointCount - 1;
                    if (pointCount < 3) {
                        pointCount = 3;
                    }
                    var lineWidth = width / pointCount;
                    sShape = sShape + "<line x1 ='" + (lineWidth / 2) + "'y1='" + posY + "' x2 = '" + width + "' y2 = '" + posY + "' stroke-dasharray = ' 0," + lineWidth * 2 + "' ";
                    sShape = sShape + "stroke-width = '" + lineWidth + "' stroke-linecap = 'round'";
                } else {
                    sShape = sShape + "<line x1 = '0' y1='" + posY + "' x2 = '" + width + "' y2 = '" + posY + "' stroke-width = '2' ";
                }
                sShape = sShape + " stroke = '" + lineColor + "'> </line>";
            }
            sShape = sShape + "<path d = '" + SelectionDetailUtil.generateShapePath(props) + "'";

            if (!option.pattern) {
                sShape = sShape + " fill = '" + color + "'";
            } else if (option.pattern === 'noFill') {
                var fColor = Parameters.get({name: ['sapUiChartBackgroundColor'], callback: function() {}});
                if (fColor === 'transparent') {
                    fColor = "white";
                }
                sShape = sShape + " fill = '" + fColor + "'";
                sShape = sShape + " stroke = '" + color + "' stroke-width= '1px'";
            } else {
                sShape = sShape + " fill = '" + (option.patternURL || option.pattern) + "'";
            }

            sShape = sShape + " transform = 'translate(" + posX + "," + posY + ")'></path>";
            sShape = sShape + '</svg>';
            return sShape;
        }
    };

    SelectionDetailUtil.generateShapePath = function (props) {
        var result;
        var temp = props.borderWidth / 2;
        switch (props.type) {
            case "circle":
                result = "M" + (-props.rx - temp) + ",0 A" + (props.rx + temp) + "," + (props.ry + temp) + " 0 1,0 " + (props.rx + temp) + ",0 A";
                result += (props.rx + temp) + "," + (props.ry + temp) + " 0 1,0 " + (-props.rx - temp) + ",0z";
                break;
            case "cross":
                result = "M" + (-props.rx - temp) + "," + (-props.ry / 3 - temp) + "H" + (-props.rx / 3 - temp) + "V" + (-props.ry - temp) + "H" + (props.rx / 3 + temp);
                result += "V" + (-props.ry / 3 - temp) + "H" + (props.rx + temp) + "V" + (props.ry / 3 + temp) + "H" + (props.rx / 3 + temp);
                result += "V" + (props.ry + temp) + "H" + (-props.rx / 3 - temp) + "V" + (props.ry / 3 + temp) + "H" + (-props.rx - temp) + "Z";
                break;
            case "diamond":
                result = "M0," + (-props.ry - temp) + "L" + (props.rx + temp) + ",0" + " 0," + (props.ry + temp) + " " + (-props.rx - temp) + ",0" + "Z";
                break;
            case "triangle-down":
            case "triangleDown":
                result = "M0," + (props.ry + temp) + "L" + (props.rx + temp) + "," + -(props.ry + temp) + " " + -(props.rx + temp) + "," + -(props.ry + temp) + "Z";
                break;
            case "triangle-up":
            case "triangleUp":
                result = "M0," + -(props.ry + temp) + "L" + (props.rx + temp) + "," + (props.ry + temp) + " " + -(props.rx + temp) + "," + (props.ry + temp) + "Z";
                break;
            case "triangle-left":
            case "triangleLeft":
                result = "M" + -(props.rx + temp) + ",0L" + (props.rx + temp) + "," + (props.ry + temp) + " " + (props.rx + temp) + "," + -(props.ry + temp) + "Z";
                break;
            case "triangle-right":
            case "triangleRight":
                result = "M" + (props.rx + temp) + ",0L" + -(props.rx + temp) + "," + (props.ry + temp) + " " + -(props.rx + temp) + "," + -(props.ry + temp) + "Z";
                break;
            case "intersection":
                result = "M" + (props.rx + temp) + "," + (props.ry + temp) + "L" + (props.rx / 3 + temp) + ",0L" + (props.rx + temp) + "," + -(props.ry + temp) + "L";
                result += (props.rx / 2 - temp) + "," + -(props.ry + temp) + "L0," + (-props.ry / 3 - temp) + "L" + (-props.rx / 2 + temp) + "," + -(props.ry + temp) + "L";
                result += -(props.rx + temp) + "," + -(props.ry + temp) + "L" + -(props.rx / 3 + temp) + ",0L" + -(props.rx + temp) + "," + (props.ry + temp) + "L";
                result += (-props.rx / 2 + temp) + "," + (props.ry + temp) + "L0," + (props.ry / 3 + temp) + "L" + (props.rx / 2 - temp) + "," + (props.ry + temp) + "Z";
                break;
            case 'squareWithRadius':
                var r = props.rx;
                var radius = r - 3;
                result = "M0," + -r + "L" + -radius + "," + -r + "Q" + -r + "," + -r + " " + -r + "," + -radius + "L" + -r + "," + radius + "Q" + -r + "," + r + " " + -radius + "," + r;
                result += "L" + radius + "," + r + "Q" + r + "," + r + " " + r + "," + radius + "L" + r + "," + -radius + "Q" + r + "," + -r + " " + radius + "," + -r + "Z";
                break;
            case "square":
            case "sector":
            default:
                result = "M" + (-props.rx - temp) + "," + (-props.ry - temp) + "L" + (props.rx + temp) + ",";
                result += (-props.ry - temp) + "L" + (props.rx + temp) + "," + (props.ry + temp) + "L" + (-props.rx - temp) + "," + (props.ry + temp) + "Z";
                break;
        }
        return result;
    };

    return SelectionDetailUtil;
});
