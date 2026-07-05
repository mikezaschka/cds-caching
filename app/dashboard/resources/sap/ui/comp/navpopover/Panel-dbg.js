/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/mdc/link/PanelRenderer",
	"sap/ui/mdc/link/Panel",
	"sap/ui/comp/personalization/LinkPanelController",
	"sap/m/p13n/Engine",
	"sap/ui/mdc/mixin/AdaptationMixin"
], (PanelRenderer, MDCPanel, LinkPanelController, Engine, AdaptationMixin) => {
	"use strict";

	/**
	 * Constructor for a new Panel.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class The Panel control is used to show <code>items</code> and <code>additionalContent</code>. After providing of the <code>items</code> it is
	 * supposed that the properties of the item structure is not changed.
	 * @extends sap.ui.mdc.link.Panel
	 * @author SAP SE
	 * @version 1.136.0
	 * @constructor
	 * @private
	 * @since 1.122.0
	 * @alias sap.ui.comp.navpopover.Panel
	 */
	const Panel = MDCPanel.extend("sap.ui.comp.navpopover.Panel", /** @lends sap.ui.comp.navpopover.Panel.prototype */ {
		renderer: PanelRenderer
	});

	Panel.prototype._registerP13n = function() {
		Engine.getInstance().register(this, {
			controller: {
				LinkItems: new LinkPanelController({ control: this })
			}
		});

		AdaptationMixin.call(Panel.prototype);

		Engine.getInstance().defaultProviderRegistry.attach(this, "Global");
	};

	return Panel;
});
