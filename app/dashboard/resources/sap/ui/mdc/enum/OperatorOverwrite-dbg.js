/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

// Provides enumeration sap.ui.mdc.enum.OperatorOverwrite
sap.ui.define(() => {
	"use strict";

	/**
	 * Enumeration of the <code>OperatorOverwrite</code> in <code>Operator</code>.
	 * @enum {string}
	 * @since 1.113
	 * @alias sap.ui.mdc.enum.OperatorOverwrite
	 * @private
	 * @ui5-restricted sap.fe
	 * @deprecated since 1.115.0 - please see {@link sap.ui.mdc.enums.OperatorOverwrite}
	 */
	const OperatorOverwrite = {
		/**
		 * Overwrite the <code>getModelFilter</code> function of the operator.
		 * @public
		 */
		getModelFilter: "getModelFilter",

		/**
		 * Overwrite the <code>getTypeText</code> function of the operator.
		 * @public
		 */
		getLongText: "getLongText"
	};

	return OperatorOverwrite;

}, /* bExport= */ true);