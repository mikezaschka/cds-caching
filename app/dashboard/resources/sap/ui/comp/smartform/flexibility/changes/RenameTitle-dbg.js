/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define(['sap/ui/fl/changeHandler/BaseRename'], function(BaseRename) {
	"use strict";

	/**
	 * Change handler for renaming a smart form title
	 *
	 * This module is only for internal use!
	 *
	 * @constructor
	 * @alias sap.ui.fl.changeHandler.RenameTitle
	 * @author SAP SE
	 * @version 1.136.0
	 * @private
	 * @since 1.46.0
	 */
	var RenameTitle = BaseRename.createRenameChangeHandler({
		propertyName : "title",
		changePropertyName : "fieldLabel",
		translationTextType : "XFLD"
	});

	return RenameTitle;
},
/* bExport= */true);