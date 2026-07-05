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
	 * Constructor for a new SemanticObjectUnavailableAction.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class Type for...
	 * @extends sap.ui.core.Element
	 * @version 1.136.0
	 * @constructor
	 * @private
	 * @since 1.60.0
	 * @alias sap.ui.mdc.link.SemanticObjectUnavailableAction
	 * @deprecated since version 1.120 - please see {@link sap.ui.mdc.ushell.SemanticObjectUnavailableAction}
	 */
	const SemanticObjectUnavailableAction = Element.extend("sap.ui.mdc.link.SemanticObjectUnavailableAction", /** @lends sap.ui.mdc.link.SemanticObjectUnavailableAction.prototype */ {
		metadata: {
			library: "sap.ui.mdc",
			properties: {
				semanticObject: {
					type: "string"
				},
				actions: {
					type: "string[]",
					defaultValue: []
				}
			}
		}
	});

	return SemanticObjectUnavailableAction;

});