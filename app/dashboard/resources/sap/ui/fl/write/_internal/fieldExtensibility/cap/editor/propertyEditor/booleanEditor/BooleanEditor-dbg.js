/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([
	"sap/ui/integration/designtime/baseEditor/propertyEditor/BasePropertyEditor"
], function(
	BasePropertyEditor
) {
	"use strict";

	/**
	 * @class
	 * Constructor for a new <code>BooleanEditor</code>.
	 *
	 * @extends sap.ui.integration.designtime.baseEditor.propertyEditor.BasePropertyEditor
	 * @alias sap.ui.fl.write._internal.fieldExtensibility.cap.editor.propertyEditor.booleanEditor.BooleanEditor
	 * @author SAP SE
	 * @since 1.93
	 * @version 1.136.0
	 *
	 * @private
	 * @ui5-restricted sap.ui.fl
	 */
	var BooleanEditor = BasePropertyEditor.extend("sap.ui.fl.write._internal.fieldExtensibility.cap.editor.propertyEditor.booleanEditor.BooleanEditor", {
		xmlFragment: "sap.ui.fl.write._internal.fieldExtensibility.cap.editor.propertyEditor.booleanEditor.BooleanEditor",
		metadata: {
			library: "sap.ui.fl"
		},
		renderer: BasePropertyEditor.getMetadata().getRenderer().render
	});

	BooleanEditor.prototype._onChange = function(oEvent) {
		var bValue = !!oEvent.getParameter("selected");
		this.setValue(bValue);
	};

	return BooleanEditor;
});
