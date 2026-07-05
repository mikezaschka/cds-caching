/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define([
	'sap/ui/core/Element'
], (Element) => {
	"use strict";

	/**
	 * Constructor for a new SemanticObjectMappingItem.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class Type for...
	 * @extends sap.ui.core.Element
	 * @version 1.136.0
	 * @constructor
	 * @private
	 * @since 1.58.0
	 * @alias sap.ui.mdc.link.SemanticObjectMappingItem
	 * @deprecated since version 1.120 - please see {@link sap.ui.mdc.ushell.SemanticObjectMappingItem}
	 */
	const SemanticObjectMappingItem = Element.extend("sap.ui.mdc.link.SemanticObjectMappingItem", /** @lends sap.ui.mdc.link.SemanticObjectMappingItem.prototype */ {
		metadata: {
			library: "sap.ui.mdc",
			properties: {
				key: {
					type: "string"
				},
				value: {
					type: "any"
				}
			}
		}
	});

	return SemanticObjectMappingItem;

});