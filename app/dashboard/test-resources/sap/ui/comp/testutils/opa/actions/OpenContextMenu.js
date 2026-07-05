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
	 * The <code>ContextMenu</code> action is used to simulate a right-click interaction
	 * with a control.
	 *
	 * @extends sap.ui.test.actions.Action
	 * @public
	 * @alias sap.ui.comp.testutils.opa.actions.OpenContextMenu
	 * @author SAP SE
	 * @since 1.77
	 */
	var ContextMenu = Action.extend("sap.ui.comp.testutils.opa.actions.OpenContextMenu", /** @lends sap.ui.comp.integration.testlibrary.actions.OpenContextMenu.prototype */ {
		metadata : {
			publicMethods : [ "executeOn" ]
		},

		/**
		 * Focuses on a given control and triggers a <code>contextmenu</code> event for it.
		 * Logs an error if the control is not visible (for example, if it has no DOM representation)
		 *
		 * @param {sap.ui.core.Control} oControl The control on which the <code>contextmenu</code> event is triggered
		 * @public
		 */
		executeOn : function (oControl) {
			var $ActionDomRef = this.$(oControl);

			if ($ActionDomRef.length) {
				this.oLogger.timestamp("sap.ui.comp.actions.ContextMenu");
				this.oLogger.debug("Right-clicked the control " + oControl);

				this._tryOrSimulateFocusin($ActionDomRef, oControl);

				$ActionDomRef.triggerHandler("contextmenu");
			}
		}
	});

	return ContextMenu;
});
