/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides control sap.ui.comp.smartform.ColumnLayout.
sap.ui.define([
	'sap/ui/comp/library',
	'sap/ui/layout/library', // as a type of the library is used in Metadata
	'sap/ui/core/Element'
], function(library, layoutLibrary, Element) {
	"use strict";

	/**
	 * Constructor for a new smartform/ColumnLayout.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * @class
	 * If this layout is used in a <code>SmartForm</code> control, a <code>ColumnLayout</code> control is used
	 * to render the <code>Form</code> control.
	 *
	 * <b>Note:</b> If this layout is used, the <code>useHorizontalLayout</code> property of the <code>SmartForm</code> control
	 * must not be set.
	 * @extends sap.ui.core.Element
	 * @constructor
	 * @public
	 * @since 1.56.0
	 * @alias sap.ui.comp.smartform.ColumnLayout
	 */
	var ColumnLayout = Element.extend("sap.ui.comp.smartform.ColumnLayout", /** @lends sap.ui.comp.smartform.ColumnLayout.prototype */
	{
		metadata: {

			interfaces: ["sap.ui.comp.smartform.SmartFormLayout"],
			library: "sap.ui.comp",
			properties: {

				/**
				 * Number of columns for extra-large size.
				 *
				 * The number of columns for extra-large size must not be smaller than the number of columns for large size.
				 */
				columnsXL : {type : "sap.ui.layout.form.ColumnsXL", group : "Appearance", defaultValue : 2},

				/**
				 * Number of columns for large size.
				 *
				 * The number of columns for large size must not be smaller than the number of columns for medium size.
				 */
				columnsL : {type : "sap.ui.layout.form.ColumnsL", group : "Appearance", defaultValue : 2},

				/**
				 * Number of columns for medium size.
				 */
				columnsM : {type : "sap.ui.layout.form.ColumnsM", group : "Appearance", defaultValue : 1},

				/**
				 * Defines how many cells a label uses if the column is large.
				 */
				labelCellsLarge : {type : "sap.ui.layout.form.ColumnCells", group : "Appearance", defaultValue : 4},

				/**
				 * Defines how many cells are empty at the end of a row.
				 * This could be used to keep the fields small on large screens.
				 */
				emptyCellsLarge : {type : "sap.ui.layout.form.EmptyCells", group : "Appearance", defaultValue : 0}
			}
		}
	});

	return ColumnLayout;

});