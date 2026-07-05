/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	'./common/BaseControl',
	'./charttooltip/TooltipContainer',
	'sap/ui/core/Element',
	'sap/ui/core/Popup',
	'./common/utils/FormatDataUtil',
	"sap/ui/thirdparty/jquery"
], function(BaseControl, TooltipContainer, Element, Popup, FormatDataUtil, jQuery) {
    "use strict";

    /**
     * Constructor for a new ui5/controls/VizTooltip.
     *
     * @param {string} [sId] id for the new control, generated automatically if no id is given
     * @param {object} [mSettings] initial settings for the new control
     *
     * @class
     * Viz Chart Tooltip
     * @extends sap.viz.ui5.controls.common.BaseControl
     *
     * @constructor
     * @public
     * @since 1.44.0
     * @alias sap.viz.ui5.controls.VizTooltip
     */
    var VizTooltip = BaseControl.extend("sap.viz.ui5.controls.VizTooltip", {
        metadata: {
            library: "sap.viz",
            properties: {
                /**
                 * The pattern is used to format the measures/timeDimensions displayed in Tooltip.
                 * If value type of format string is String or an object with 'formatPattern' and 'dataUnit' values defined, the value will be used to format all measures(not works with TimeDimension). The value of ‘formatPattern’ here is a string to define the format pattern of numbers, and value of ‘dataUnit’ is a postfix string to indicate the unit of measure.
                 * If value type is Object whose key is measure/timeDimension name, the possible value type is string or an object with ‘formatPattern’ and ‘dataUnit’ values defined. And each string value will be used to format the specified measure or time dimension.
                 * And TimeDimension does not support 'dataUnit'.
                 */
                formatString: {type: "any", defaultValue: null}
            }
        },
        renderer: {
            apiVersion: 2,
            render: function (oRm, oControl) {
                oRm.openStart("div", oControl)
                   .openEnd()
                   .close("div");
            }
        }
    });

    VizTooltip.prototype.init = function() {
        BaseControl.prototype.init.apply(this, arguments);
        this._uid = null;
        this._oTooltipContainer = null;
        this._oPopup = null;
    };

    VizTooltip.prototype.exit = function() {
        BaseControl.prototype.exit.apply(this, arguments);

        var vizFrame = Element.getElementById(this._uid);
        if (vizFrame) {
            if (vizFrame._vizFrame) {
                vizFrame._vizFrame.off('showInstantTooltip');
                vizFrame._vizFrame.off('hideInstantTooltip');
                var connectCallback = vizFrame._onConnectPopover() || {};
                if (connectCallback.ref === this) {
                    vizFrame._onConnectPopover(null);
                }
            } else {
                vizFrame._onConnectPopover(jQuery.proxy(function(event) {
                    if (!vizFrame._vizFrame) {
                        return;
                    }
                    vizFrame._vizFrame.off('showInstantTooltip');
                    vizFrame._vizFrame.off('hideInstantTooltip');
                }, this));
            }
        }

        if (this._oPopup) {
            this._oPopup.destroy();
            this._oPopup = null;
        }

        if (this._oTooltipContainer) {
            this._oTooltipContainer.destroy();
            this._oTooltipContainer = null;
        }

        this._uid = null;
    };

    /**
     * Connect chart Tooltip with VizFrame. Chart Tooltip is only supported for VizFrame with 'fiori' type. It must be called by application.
     *
     * @example
     * // VizFrame required from "sap/viz/ui5/controls/VizFrame"
     * // VizTooltip required from "sap/viz/ui5/controls/VizTooltip"
     * var vizFrame = new VizFrame({
     *  'vizType' : 'bar',
     *  'uiConfig' : {
     *     'applicationSet': 'fiori'
     *   }
     * });
     * var Tooltip = new VizTooltip({});
     * Tooltip.connect(vizFrame.getVizUid());
     *
     * @param
     *   {string} uid
     * @public
     */
    VizTooltip.prototype.connect = function(uid) {
        this._uid = uid;
        if (!this._oPopup) {
            this._createTooltip();
        }

        var vizFrame = Element.getElementById(this._uid);
        var uiConfig = vizFrame.getUiConfig();
        if (!uiConfig || uiConfig.applicationSet !== 'fiori') {
            return;
        }

        var that = this;
        function connectCb() {
            if (!vizFrame._vizFrame) {
                return;
            }
            that._chartType = vizFrame._vizFrame.type();
            vizFrame._vizFrame.off('showTooltip');
            vizFrame._vizFrame.off('hideTooltip');
            vizFrame._vizFrame.on('showInstantTooltip', function(event) {
                that._prepareTooltip(event.data);
                that._oPopup.close(0);
                that._oPopup.open(0);
            });
            vizFrame._vizFrame.on('hideInstantTooltip', function() {
                that._oPopup.close(0);
            });
        }

        connectCb.ref = this;
        if (vizFrame._vizFrame) {
            connectCb();
        }
        vizFrame._onConnectPopover(connectCb);
    };

    VizTooltip.prototype._createTooltip = function(data) {
        this._oTooltipContainer = new TooltipContainer();
        this._oPopup = new Popup();
        this._oPopup.setContent(this._oTooltipContainer);
        this._oPopup.setShadow(false);
    };

    VizTooltip.prototype._prepareTooltip = function(data) {
        var config = {
            formatString: this.getFormatString(),
            chartType: this._chartType,
            mode: "tooltip"
        };
        var formattedData = FormatDataUtil.formatData(data, config);
        this._oTooltipContainer.setContent(formattedData);
        var my = Popup.Dock.CenterBottom;
        var at = Popup.Dock.LeftTop;
        var x = data.point.x;
        var padding = 10;
        var y = data.point.y;
        var offset = 0 + " " + (-padding);

        // we need to simulate mousemove event since keyboard do not support this
        // And using offset will not trigger flip behavior
        var of = document.createEvent('MouseEvents');
        of.initMouseEvent("mousemove", true, true, window, 0, 0, 0, x, y, false, false, false, false, 0, null);
        //wrap and fix to jQuery.Event
        of = jQuery.event.fix(of);

        this._oPopup.setPosition(my, at, of, offset, "flipfit");
    };

    VizTooltip.prototype.addStyleClass = function() {
        this._oTooltipContainer.addStyleClass.apply(this._oTooltipContainer, arguments);
    };

    VizTooltip.prototype.removeStyleClass = function() {
        this._oTooltipContainer.removeStyleClass.apply(this._oTooltipContainer, arguments);
    };

    return VizTooltip;
});
