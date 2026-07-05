/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define(["sap/ui/base/DataType"], (DataType) => {
	"use strict";

	/**
	 *
	 * Defines the personalization mode of the chart.
	 *
	 * @enum {string}
	 * @alias sap.ui.mdc.enums.ChartP13nMode
	 * @since 1.115
	 * @public
	 * @experimental As of version 1.115
	 */
	const ChartP13nMode = {
		/**
		 * Item personalization is enabled.
		 *
		 * @public
		 */
		Item: "Item",
		/**
		 * Sort personalization is enabled.
		 *
		 * @public
		 */
		Sort: "Sort",
		/**
		 * Chart type personalization is enabled.
		 *
		 * @public
		 */
		Type: "Type",
		/**
		 * Filter personalization is enabled.
		 *
		 * @public
		 */
		Filter: "Filter"
	};

	DataType.registerEnum("sap.ui.mdc.enums.ChartP13nMode", ChartP13nMode);

	return ChartP13nMode;

}, /* bExport= */ true);