/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define([
	"./ColumnSettings"
], (ColumnSettings) => {
	"use strict";

	/**
	 * Constructor for a new <code>ResponsiveColumnSettings</code>.
	 *
	 * @param {string} [sId] Optional ID for the new object; generated automatically if no non-empty ID is given
	 * @param {object} [mSettings] Initial settings for the new object
	 *
	 * @class The table type info class for the metadata-driven table.
	 * @extends sap.ui.mdc.table.ColumnSettings
	 * @version 1.136.0
	 * @author SAP SE
	 * @constructor
	 * @public
	 * @alias sap.ui.mdc.table.ResponsiveColumnSettings
	 * @since 1.110
	 */
	const ResponsiveColumnSettings = ColumnSettings.extend("sap.ui.mdc.table.ResponsiveColumnSettings", {
		metadata: {
			library: "sap.ui.mdc",
			"final": true,
			properties: {
				/**
				 * Defines the column importance.
				 *
				 * Columns are moved to the pop-in area in the following order:
				 * <ul>
				 *   <li>With importance <code>High</code>: moved last</li>
				 *   <li>With importance <code>Medium</code> or <code>None</code>: moved second</li>
				 *   <li>With importance <code>Low</code>: moved first</li>
				 * </ul>
				 *
				 * @since 1.110
				 */
				importance: {
					type: "sap.ui.core.Priority",
					group: "Behavior",
					defaultValue: "None"
				},
				/**
				 * Defines the control serialization function to merge duplicate cells into one cell block.
				 * This function is used to compare values of two cells.
				 *
				 * <b>Note:</b> Don't set this property for cells for which the content provides a user interaction, such as <code>sap.m.Link</code>.
				 *
				 * @since 1.110
				 */
				mergeFunction: {
					type: "string",
					group: "Appearance"
				}
			}
		}
	});

	return ResponsiveColumnSettings;
});