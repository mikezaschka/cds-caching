/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

/**
 * Utility class to access data types, if the SmartField uses a JSON model.
 *
 * @name sap.ui.comp.smartfield.JSONTypes
 * @author SAP SE
 * @version 1.136.0
 * @private
 * @since 1.28.0
 * @returns {sap.ui.comp.smartfield.JSONTypes} the new instance.
 */
sap.ui.define([
	"sap/ui/model/type/Boolean",
	"sap/ui/model/type/Date",
	"sap/ui/model/type/Float",
	"sap/ui/model/type/Integer",
	"sap/ui/model/type/String"
], function(BooleanType, DateType, FloatType, IntegerType, StringType) {
	"use strict";

	/**
	 * @private
	 * @constructor
	 */
	var JSONTypes = function() {
		//nothing to do here.
	};

	/**
	 * Returns an instance of a sub-class of <code>sap.ui.model.Type</code> depending on the OData property's EDM type.
	 *
	 * @param {sType} sType the name of the type to be created.
	 * @returns {sap.ui.model.Type} an instance of a sub-class of <code>sap.ui.model.Type</code>.
	 * @public
	 */
	JSONTypes.prototype.getType = function(sType) {
		if (sType) {
			switch (sType) {
				case "Boolean":
					return new BooleanType();
				case "Date":
					return new DateType();
				case "Float":
					return new FloatType();
				case "Integer":
					return new IntegerType();
				default:
					return new StringType();
			}
		}

		return null;
	};

	/**
	 * Frees all resources claimed during the life-time of this instance.
	 *
	 * @public
	 */
	JSONTypes.prototype.destroy = function() {
		//nothing to do here.
	};

	return JSONTypes;
}, true);