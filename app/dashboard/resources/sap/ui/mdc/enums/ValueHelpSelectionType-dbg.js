/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

// Provides enumeration sap.ui.mdc.enums.ValueHelpSelectionType
sap.ui.define(["sap/ui/base/DataType"], (DataType) => {
	"use strict";


	/**
	 * Enumeration of the possible selection types in {@link sap.ui.mdc.ValueHelp ValueHelp}
	 *
	 * @enum {string}
	 * @public
	 * @since 1.115
	 * @alias sap.ui.mdc.enums.ValueHelpSelectionType
	 */
	const ValueHelpSelectionType = {
		/**
		 * The given conditions are set and replace the existing ones.
		 * @public
		 */
		Set: "Set",

		/**
		 * The given conditions are just added to the existing ones, if they don't already exist.
		 * @public
		 */
		Add: "Add",

		/**
		 * The given conditions are removed.
		 * @public
		 */
		Remove: "Remove"
	};

	DataType.registerEnum("sap.ui.mdc.enums.ValueHelpSelectionType", ValueHelpSelectionType);

	return ValueHelpSelectionType;

}, /* bExport= */ true);