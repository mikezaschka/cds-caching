/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/ui/core/Lib"], function(Library) {
	"use strict";

	var oCompBundle = Library.getResourceBundleFor("sap.ui.comp");
	var oMBundle = Library.getResourceBundleFor("sap.m");
	var oMdcBundle = Library.getResourceBundleFor("sap.ui.mdc");

	var Util = {

		texts: {
			resetwarning: oMBundle.getText("MSGBOX_TITLE_WARNING"),
			moreLinks: oCompBundle.getText("POPOVER_DEFINE_LINKS"),
            p13nPopoverTitle: oCompBundle.getText("POPOVER_SELECTION_TITLE"),
            ok: oCompBundle.getText("FORM_PERS_DIALOG_OK"),
            reset: oMdcBundle.getText("p13nDialog.RESET")
		},

		icons: {
			decline: "sap-icon://decline",
			group: "sap-icon://group-2",
			expandGroup: "sap-icon://slim-arrow-right"
		}

	};

	return Util;
});
