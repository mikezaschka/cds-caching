/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides control sap.ui.comp.navpopover.LinkData.
sap.ui.define(['sap/ui/comp/library', 'sap/ui/mdc/link/LinkItem'], function(library, LinkItem) {
	"use strict";

	/**
	 * Constructor for a new navpopover/LinkData.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * @class Stores display text together with a navigation target hyperlink.<br>
	 *        The LinkData class is used by {@link sap.ui.comp.navpopover.SmartLink SmartLink} and
	 *        {@link sap.ui.comp.navpopover.SemanticObjectController SemanticObjectController} to define the visible links on
	 *        {@link sap.ui.comp.navpopover.NavigationPopover NavigationPopover}.
	 * @extends sap.ui.mdc.link.LinkItem
	 * @constructor
	 * @public
	 * @since 1.28.0
	 * @alias sap.ui.comp.navpopover.LinkData
	 */
	var LinkData = LinkItem.extend("sap.ui.comp.navpopover.LinkData", /** @lends sap.ui.comp.navpopover.LinkData.prototype */
	{
		metadata: {

			library: "sap.ui.comp",
			properties: {
				/**
				 * The standard values for the <code>target</code> property are: _self, _top, _blank, _parent, _search. Alternatively, a frame name
				 * can be entered. This property is only used if the <code>href</code> property is set.
				 */
				target: {
					type: "string",
					defaultValue: null
				},
				/**
				 * Describes whether the link should be visible on the screen.
				 * @since 1.44.0
				 */
				visible: {
					type: "boolean",
					defaultValue: true
				},
				/**
				 * Marker for superior action.
				 * @since 1.48.0
				 */
				isSuperiorAction: {
					type: "boolean"
				},
				/**
				 * Describes whether the visibility is changed by end user or not.
				 * @since 1.58.0
				 * @deprecated since version 1.122. The SmartLink now uses information stored on {@link sap.ui.mdc.link.PanelItem}
				 */
				visibleChangedByUser: {
					type: "boolean"
				}
			}
		}
	});

	LinkData.prototype.getJson = function() {
		return {
			key: this.getKey(),
			href: this.getHref(),
			internalHref: this.getInternalHref(),
			text: this.getText(),
			target: this.getTarget(),
			description: this.getDescription(),
			visible: this.getVisible(),
			press: this.getPress(),
			isSuperiorAction: this.getIsSuperiorAction()
		};
	};

	LinkData.convert2Json = function(aLinkDatas) {
		return aLinkDatas.map(function(oLinkData) {
			return oLinkData.getJson();
		});
	};

	LinkData.prototype.setIsSuperiorAction = function(bIsSuperiorAction) {
		return this.setInitiallyVisible(bIsSuperiorAction);
	};

	return LinkData;

});
