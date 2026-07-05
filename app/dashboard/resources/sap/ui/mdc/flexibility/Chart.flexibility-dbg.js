/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([
	'./SortFlex',
	'./ChartItemFlex',
	'./ConditionFlex',
	'./ChartTypeFlex'
], (SortFlex, ChartItemFlex, ConditionFlex, ChartTypeFlex) => {
	"use strict";
	/**
	 * Chart-control-specific change handler that enables the storing of changes in the layered repository of the flexibility services.
	 *
	 * @alias sap.ui.mdc.flexibility.Chart
	 * @author SAP SE
	 * @version 1.136.0
	 */
	return {
		addItem: ChartItemFlex.addItem,
		removeItem: ChartItemFlex.removeItem,
		moveItem: ChartItemFlex.moveItem,
		setChartType: ChartTypeFlex.setChartType,
		removeSort: SortFlex.removeSort,
		addSort: SortFlex.addSort,
		moveSort: SortFlex.moveSort,
		addCondition: ConditionFlex.addCondition,
		removeCondition: ConditionFlex.removeCondition
	};
}, /* bExport= */ true);