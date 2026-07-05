/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/ui/core/Lib"], function (Library) {
	"use strict";

	var oCompBundle = Library.getResourceBundleFor("sap.ui.comp"),
		oMBundle = Library.getResourceBundleFor("sap.m"),
		Util = {
			texts: {
				ok: oCompBundle.getText("VALUEHELPDLG_OK"),
				cancel: oCompBundle.getText("VALUEHELPDLG_CANCEL"),
				addRowButton: oCompBundle.getText("VALUEHELPDLG_CONDITIONPANEL_ADD"),
				placeholderFromField: oMBundle.getText("CONDITIONPANEL_LABELFROM"),
				placeholderToField: oMBundle.getText("CONDITIONPANEL_LABELTO"),
				placeholderValueField: oMBundle.getText("CONDITIONPANEL_LABELVALUE")
			}
		};

	return Util;
});
