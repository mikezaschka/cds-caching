/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define(["sap/ui/base/DataType"], (DataType) => {
	"use strict";

	/**
	 * Multi-select mode of the table.
	 *
	 * @enum {string}
	 * @private
	 * @alias sap.ui.mdc.enums.TableMultiSelectMode
	 * @since 1.115
	 * @ui5-restricted sap.ui.mdc
	 */
	const TableMultiSelectMode = {
		/**
		 * The table shows a Select All checkbox
		 *
		 * @public
		 */
		Default: "Default",

		/**
		 * The table shows a Clear All icon
		 *
		 * @public
		 */
		ClearAll: "ClearAll"
	};

	DataType.registerEnum("sap.ui.mdc.enums.TableMultiSelectMode", TableMultiSelectMode);

	return TableMultiSelectMode;

}, /* bExport= */ true);