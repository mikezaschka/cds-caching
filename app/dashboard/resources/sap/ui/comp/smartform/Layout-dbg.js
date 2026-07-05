/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides control sap.ui.comp.smartform.Layout.
sap.ui.define([
	'sap/ui/comp/library',
	'sap/ui/layout/library', // as a type of the library is used in Metadata
	'sap/ui/core/Element'
], function(library, layoutLibrary, Element) {
	"use strict";

	/**
	 * Constructor for a new smartform/Layout.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * @class Layout settings to adjust the <code>ResponsiveGridLayout</code> used inside the <code>Form</code>.
	 * @extends sap.ui.core.Element
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.smartform.Layout
	 */
	var Layout = Element.extend("sap.ui.comp.smartform.Layout", /** @lends sap.ui.comp.smartform.Layout.prototype */
	{
		metadata: {

			interfaces: ["sap.ui.comp.smartform.SmartFormLayout"],
			library: "sap.ui.comp",
			properties: {

				/**
				 * Default span for labels in extra large size.
				 *
				 * @since 1.38.0
				 */
				labelSpanXL: {
					type: "int",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Default span for labels in large size. This span is only used if more than 1 container is in one line, if only 1 container is in
				 * the line the <code>labelSpanM</code> value is used.
				 */
				labelSpanL: {
					type: "int",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Default span for labels in medium size. This property is used for full size containers. If more than one Container is in one line,
				 * <code>labelSpanL</code> is used.
				 */
				labelSpanM: {
					type: "int",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Default span for labels in small size.
				 */
				labelSpanS: {
					type: "int",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Number of grid cells that are empty at the end of each line on extra large size.
				 *
				 * @since 1.38.0
				 */
				emptySpanXL: {
					type: "int",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Number of grid cells that are empty at the end of each line on large size.
				 */
				emptySpanL: {
					type: "int",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Number of grid cells that are empty at the end of each line on medium size.
				 */
				emptySpanM: {
					type: "int",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Number of grid cells that are empty at the end of each line on small size.
				 */
				emptySpanS: {
					type: "int",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Number of columns for extra large size.<br>
				 * The number of columns for extra large size must not be smaller than the number of columns for large size.
				 *
				 * @since 1.38.0
				 */
				columnsXL: {
					type: "int",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Number of columns for large size.<br>
				 * The number of columns for large size must not be smaller than the number of columns for medium size.
				 */
				columnsL: {
					type: "int",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Number of columns for medium size.
				 */
				columnsM: {
					type: "int",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * If the <code>SmartForm</code> contains only one single Group and this property is set, the Group is displayed using the full size of the
				 * <code>SmartForm</code>. In this case the properties <code>columnsL</code> and <code>columnsM</code> are ignored.<br>
				 * In all other cases the Group is displayed in the size of one column.
				 *
				 * @since 1.34.1
				 */
				singleGroupFullSize: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Breakpoint (in pixel) between large size and extra large (XL) size.
				 *
				 * @since 1.38.0
				 */
				breakpointXL: {
					type: "int",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Breakpoint (in pixel) between Medium size and Large size.
				 */
				breakpointL: {
					type: "int",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * reakpoint (in pixel) between Small size and Medium size.
				 */
				breakpointM: {
					type: "int",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * A string type that represents Grid's span values for large, medium and small screens. Allowed values are separated by space Letters
				 * L, M or S followed by number of columns from 1 to 12 that the container has to take, for example: "L2 M4 S6", "M12", "s10" or "l4
				 * m4". Note that the parameters has to be provided in the order large medium small.<br>
				 * The value set here will be set to all group elements when used with horizontal layout (<code>SmartForm</code> property <code>useHorizontalLayout</code>)
				 */
				gridDataSpan: {
					type: "sap.ui.layout.GridSpan",
					group: "Misc",
					defaultValue: ""
				}
			}
		},
		_oSpan: {XL: 0, L: 0, M: 0, S:0}
	});

	Layout.prototype.setGridDataSpan = function( sGridDataSpan ) {

		// calculate spans for each size
		var aResult = [];

		var Pattern = /XL([1-9]|1[0-2])(?:\s|$)/i;
		aResult = Pattern.exec(sGridDataSpan);
		if (aResult && aResult[1]) {
			this._oSpan.XL = parseInt(aResult[1]);
		} else {
			this._oSpan.XL = 0;
		}

		Pattern = /\bL([1-9]|1[0-2])(?:\s|$)/i;
		aResult = Pattern.exec(sGridDataSpan);
		if (aResult && aResult[1]) {
			this._oSpan.L = parseInt(aResult[1]);
			if (!this._oSpan.XL) {
				this._oSpan.XL = this._oSpan.L;
			}
		}

		Pattern = /M([1-9]|1[0-2])(?:\s|$)/i;
		aResult = Pattern.exec(sGridDataSpan);
		if (aResult && aResult[1]) {
			this._oSpan.M = parseInt(aResult[1]);
		}

		Pattern = /S([1-9]|1[0-2])(?:\s|$)/i;
		aResult = Pattern.exec(sGridDataSpan);
		if (aResult && aResult[1]) {
			this._oSpan.S = parseInt(aResult[1]);
		}

		this.setProperty("gridDataSpan", sGridDataSpan);

		return this;

	};

	Layout.prototype._getGridDataSpanNumbers = function( ) {

		return this._oSpan;

	};

	return Layout;

});