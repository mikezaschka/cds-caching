/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(function() {
	"use strict";
	const ASYNC = true;

	/**
	 * Creates a SmartLabel control for a given labelFor element.
	 *
	 * @param {Object} mPropertyBag - The property bag containing necessary parameters.
	 * @param {Object} mPropertyBag.modifier - The modifier object.
	 * @param {Object} mPropertyBag.appComponent - The app component.
	 * @param {Object} mPropertyBag.view - The view.
	 * @param {Object} mPropertyBag.labelFor - The Label
	 * @returns {sap.ui.comp.smartfield.SmartLabel} - The created SmartLabel control.
	 */
	function createLabel(mPropertyBag) {
		return mPropertyBag.modifier.createControl("sap.ui.comp.smartfield.SmartLabel",
			mPropertyBag.appComponent,
			mPropertyBag.view,
			mPropertyBag.labelFor + "-label",
			{labelFor: mPropertyBag.labelFor},
			ASYNC
		);
	}

	/**
	 * Creates a SmartField control with the specified properties.
	 *
	 * @param {Object} mPropertyBag - The property bag containing necessary parameters.
	 * @param {Object} mPropertyBag.modifier - The modifier object.
	 * @param {Object} mPropertyBag.appComponent - The app component.
	 * @param {Object} mPropertyBag.view - The view.
	 * @param {string} mPropertyBag.fieldSelector - The field selector.
	 * @param {string} mPropertyBag.bindingPath - The binding path for the value property.
	 * @returns {sap.ui.comp.smartfield.SmartField} - The created SmartField control.
	 */
	function createField(mPropertyBag) {
		return mPropertyBag.modifier.createControl("sap.ui.comp.smartfield.SmartField",
			mPropertyBag.appComponent,
			mPropertyBag.view,
			mPropertyBag.fieldSelector,
			{
				value : "{" + mPropertyBag.bindingPath + "}"
			},
			ASYNC
		);
	}

	/**
	 * Default write delegate for Control sap.ui.comp.smartfield.SmartField
	 * @namespace sap.ui.comp.smartfield.flexibility.SmartFieldWriteDelegate
	 * @implements {sap.ui.fl.interfaces.Delegate}
	 * @since 1.79
	 * @private
	 */
	var SmartFieldWriteDelegate = {}; /** @lends sap.ui.comp.smartfield.flexibility.SmartFieldWriteDelegate */

	/**
	 *	@inheritdoc
	 */
	SmartFieldWriteDelegate.createLabel = function (mPropertyBag) {
		return createLabel(mPropertyBag);
	};

	/**
	 * @inheritdoc
	 */
	SmartFieldWriteDelegate.createControlForProperty = async function (mPropertyBag) {
		const oControl = await createField(mPropertyBag);

		return {
			control: oControl,
			valueHelp: undefined
		};
	};

	return SmartFieldWriteDelegate;
});
