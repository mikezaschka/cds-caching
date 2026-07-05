/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define(['./FilterItemFlex', './ConditionFlex', './PropertyInfoFlex'], (FilterItemFlex, ConditionFlex, PropertyInfoFlex) => {
	"use strict";

	/**
	 * FilterBar-control-specific change handler that enables the storing of changes in the layered repository of the flexibility services.
	 *
	 * @alias sap.ui.mdc.flexibility.FilterBar
	 * @author SAP SE
	 * @version 1.136.0
	 */

	return {
		"addFilter": FilterItemFlex.createAddChangeHandler(),
		"removeFilter": FilterItemFlex.createRemoveChangeHandler(),
		"moveFilter": FilterItemFlex.createMoveChangeHandler(),
		"addCondition": ConditionFlex.addCondition,
		"removeCondition": ConditionFlex.removeCondition,
                /**
                 * @deprecated since 1.100
                 */
		"addPropertyInfo": PropertyInfoFlex.addPropertyInfo
	};
}, /* bExport= */ true);