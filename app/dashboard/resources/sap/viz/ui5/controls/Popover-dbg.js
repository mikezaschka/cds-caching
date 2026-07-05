/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides control sap.viz.ui5.controls.Popover.
sap.ui.define([
	'sap/ui/core/Element',
	'sap/ui/layout/Grid',
	'sap/ui/layout/form/SimpleForm',
	'sap/viz/library',
	'./common/BaseControl',
	'./chartpopover/ChartPopover',
	"sap/ui/thirdparty/jquery",
	"./PopoverRenderer"
], function(Element, Grid, SimpleForm, library, BaseControl, ChartPopover, jQuery) {
	"use strict";

	/**
	 * Constructor for a new ui5/controls/Popover.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * Viz Chart Popover
	 * @extends sap.viz.ui5.controls.common.BaseControl
	 *
	 * @constructor
	 * @public
	 * @since 1.22.0
	 * @experimental Since version 1.22.0.
	 * API is not finished yet and might change completely
	 * @alias sap.viz.ui5.controls.Popover
	 */
	var Popover = BaseControl.extend("sap.viz.ui5.controls.Popover", /** @lends sap.viz.ui5.controls.Popover.prototype */ { metadata : {

		library : "sap.viz",
		properties : {

			/**
			 * A callback function let user customize Popover's content panel.
			 */
			customDataControl : {type : "any", defaultValue : null},

			/**
			 * The items of this list or rows of Action List in Home Page inside the Popover.
			 */
			actionItems : {type : "object[]", defaultValue : null},

			/**
			 * The pattern is used to format the measures displayed in Popover.
			 * If value type of format string is String, the format string will be used to format all measures.
			 * If value type is Object, each format string in the Object will be used to format the specified measure or time dimension.
			 */
			formatString : {type : "any", defaultValue : null},

			/**
			 * Show line with popover marker in line/combination charts.
			 */
			showLine : {type : "boolean", defaultValue : true}
		}
	}});


	Popover.prototype.init = function() {
	  BaseControl.prototype.init.apply(this, arguments);

	  this._Popover = undefined;
	  this._uid = undefined;
	};

	Popover.prototype.exit = function() {
	    BaseControl.prototype.exit.apply(this, arguments);

	    var vizFrame = Element.getElementById(this._uid);
        if (vizFrame) {
            if (vizFrame._vizFrame) {
                vizFrame._vizFrame.off('showTooltip');
                vizFrame._vizFrame.off('hideTooltip');
                var connectCallback = vizFrame._onConnectPopover() || {};
                if (connectCallback.ref === this) {
					vizFrame._onConnectPopover(undefined);
                }
            } else {
                vizFrame._onConnectPopover(jQuery.proxy(function(event) {
                    if (!vizFrame._vizFrame) {
                        return;
                    }
                    vizFrame._vizFrame.off('showTooltip');
                    vizFrame._vizFrame.off('hideTooltip');
                }, this));
            }
        }

        if (this._Popover) {
            this._Popover.destroy();
        }
	    this._Popover = undefined;
	    this._uid = undefined;
	};

	/**
	 * Connect chart Popover with VizFrame.
	 *
	 * Chart Popover is only supported for VizFrame with type 'fiori'.
	 * This method must be called by application.
	 *
	 * @example:
	 * // VizFrame required from "sap/viz/ui5/controls/VizFrame"
	 * // Popover required from "sap/viz/ui5/controls/Popover"
	 *
	 * var vizFrame = new VizFrame({
	 * 	'vizType' : 'bar',
	 *  'uiConfig' : {
	 *     'applicationSet': 'fiori'
	 *   }
	 * });
	 * var vizPopover = new Popover({});
	 * vizPopover.connect(vizFrame.getVizUid());
	 *
	 * @param {string} uid
	 *   Unique ID of the VizFrame to connect this Popover with
	 * @public
	 */
	Popover.prototype.connect = function(uid){
	  this._uid = uid;
	  if (!this._Popover){
	    this._createPopover();
	  }

	  var vizFrame = Element.getElementById(this._uid);
	  var uiConfig = vizFrame.getUiConfig();
	  if (!uiConfig || uiConfig.applicationSet !== 'fiori') {
		return;
	  }
	  var popOver = this._Popover;

	  function connectCb() {
		if (!vizFrame._vizFrame) {
			return;
		  }
		  vizFrame._vizFrame.off('showInstantTooltip');
		  vizFrame._vizFrame.off('hideInstantTooltip');
		  vizFrame._vizFrame.on('showTooltip', function(event) {
			if (event.data.target) {
				  popOver.setOptions(event.data).openBy(event.data.target);
			}
		  });
		  vizFrame._vizFrame.on('hideTooltip', function() {
			  popOver.close();
		  });
		  popOver.setChartType(vizFrame._vizFrame.type());
		  popOver._oPopover.setOffsetX(0);
		  popOver._oPopover.setOffsetY(0);
	  }

	  connectCb.ref = this;

	  if (vizFrame._vizFrame) {
		  connectCb();
	  }
	  vizFrame._onConnectPopover(connectCb);
	};

	/**
	 * Close Chart's Popover.
	 *
	 * @public
	 */
	Popover.prototype.close = function(){
	    if (this._Popover){
	        this._Popover.close();
	    }
	};

	Popover.prototype.setFormatString = function(fStr) {
		this.setProperty("formatString", fStr);
		if (this._Popover){
			this._Popover.setFormatString(fStr);
		} else {
			this._createPopover();
		}
		return this;
	};

	Popover.prototype.setCustomDataControl = function(con){
		this.setProperty('customDataControl', con);
		if (this._Popover){
			this._Popover.setCustomDataControl(con);
		} else {
			this._createPopover();
		}
		return this;
	};

	Popover.prototype.setActionItems = function(actionItems){
		this.setProperty('actionItems', actionItems);
		if (this._Popover){
			this._Popover.setActionItems(actionItems);
		} else {
			this._createPopover();
		}
		return this;
	};

	Popover.prototype.setShowLine = function(isShowLine){
        this.setProperty('showLine', isShowLine);
        if (this._Popover){
            this._Popover.setShowLine(isShowLine);
        } else {
            this._createPopover();
        }
        return this;
    };

	Popover.prototype._createPopover = function(){
	  this._Popover = new ChartPopover({
	    actionItems : this.getActionItems(),
	    customDataControl : this.getCustomDataControl(),
	    formatString : this.getFormatString(),
	    showLine : this.getShowLine()
	  });
	 };

    Popover.prototype.addStyleClass = function() {
        this._Popover.addStyleClass.apply(this._Popover, arguments);
    };

    Popover.prototype.removeStyleClass = function() {
        this._Popover.removeStyleClass.apply(this._Popover, arguments);
    };

	return Popover;

});
