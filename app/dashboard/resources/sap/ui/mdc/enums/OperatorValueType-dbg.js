/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define(["sap/ui/base/DataType"], (DataType) => {
	"use strict";

	/**
	 * Defines what data type is used for parse or format the condition values on a {@link sap.ui.mdc.condition.Operator Operator}.
	 *
	 * @enum {string}
	 * @public
	 * @since 1.115
	 * @alias sap.ui.mdc.enums.OperatorValueType
	 */
	const OperatorValueType = {
		/**
		 * The <code>Type</code> of the <code>Field</code> or <code>FilterField</code> using the <code>Operator</code> is used.
		 *
		 * @public
		 */
		Self: "Self",

		/**
		 * A simple string type is used to display static text.
		 *
		 * @public
		 */
		Static: "Static",

		/**
		 * The <code>Type</code> of the <code>Field</code> or <code>FilterField</code> using the <code>Operator</code> is used
		 * for validation, but the user input is used as value.
		 *
		 * @public
		 */
		SelfNoParse: "SelfNoParse"
	};

	DataType.registerEnum("sap.ui.mdc.enums.OperatorValueType", OperatorValueType);

	return OperatorValueType;

}, /* bExport= */ true);