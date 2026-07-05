/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/test/actions/Action"
], function(Action) {
	"use strict";

	/**
	 * @class
	 * The <code>CloseNavigationPopover</code> action is used to close the
	 * {@link sap.ui.comp.navpopover.NavigationPopover} of a {@link sap.ui.comp.navpopover.SmartLink} control.
	 *
	 * @extends sap.ui.test.actions.Action
	 * @public
	 * @alias sap.ui.comp.integration.testlibrary.actions.CloseNavigationPopover
	 * @author SAP SE
	 * @since 1.77
	 */
	var CloseNavigationPopover = Action.extend("sap.ui.comp.integration.testlibrary.actions.CloseNavigationPopover", /** @lends sap.ui.comp.integration.testlibrary.actions.CloseNavigationPopover.prototype */ {
		metadata : {
			publicMethods : [ "executeOn" ]
		},

		/**
		 * Focuses on a given {@link sap.ui.comp.navpopover.NavigationPopover} control and closes it.
		 * Logs an error if the control is not visible (for example, if it has no DOM representation)
		 *
		 * @param {sap.ui.core.Control} oControl The {@link sap.ui.comp.navpopover.NavigationPopover} control which is to be closed
		 * @public
		 */
		executeOn : function (oControl) {
			if (oControl && oControl.getMetadata().getName() === "sap.ui.comp.navpopover.NavigationPopover") {
				var $ActionDomRef = this.$(oControl);
				this._tryOrSimulateFocusin($ActionDomRef, oControl);
				oControl.close();
			}
		}
	});

	return CloseNavigationPopover;
});
