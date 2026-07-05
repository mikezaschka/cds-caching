/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define(["sap/ui/base/DataType"], (DataType) => {
	"use strict";

	/**
	 * @enum {string}
	 * @private
	 * @since 1.115
	 * @alias sap.ui.mdc.enums.ChartItemType
	 */
	const ChartItemType = {
		/**
		 * Dimension Item
		 * @public
		 */
		Dimension: "Dimension",
		/**
		 * Measure Item
		 * @public
		 */
		Measure: "Measure"
	};

	DataType.registerEnum("sap.ui.mdc.enums.ChartItemType", ChartItemType);

	return ChartItemType;

}, /* bExport= */ true);