/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/mdc/p13n/subcontroller/LinkPanelController", "sap/ui/core/Lib", "sap/m/MessageBox"
], (MDCLinkPanelController, Library, MessageBox) => {
	"use strict";

	/**
	 * {@link sap.ui.mdc.p13n.subcontroller.LinkPanelController} implementation that is used alongside the <code>SmartLinkFieldInfo</code> to enable <code>SmartLink</code> personalization.
	 * @private
	 * @since 1.122.0
	 */
	const LinkPanelController = MDCLinkPanelController.extend("sap.ui.comp.personalization.LinkPanelController", {});

	LinkPanelController.prototype.getSelectorForReset = function() {
		return this.getAdaptationControl();
	};

	LinkPanelController.prototype.getSelectorsForHasChanges = function() {
		return this.getAdaptationControl();
	};

	LinkPanelController.prototype._createAddRemoveChange = function(oControl, vOperations, oContent) {
		const sLinkItemId = oContent.name;

		return {
			selectorElement: oControl,
			changeSpecificData: {
				changeType: vOperations,
				content: {
					visible: vOperations === "addLink",
					key: sLinkItemId,
					selector: {
						id: sLinkItemId,
						idIsLocal: false
					}
				}
			}
		};
	};

	LinkPanelController.prototype._navigate = function(sHref) {
		this.getAdaptationControl().getMetadata()._oParent._oClass.navigate(sHref);
	};

	LinkPanelController.prototype.getChangeOperations = function() {
		return {
			add: "addLink",
			remove: "removeLink"
		};
	};

	return LinkPanelController;

});
