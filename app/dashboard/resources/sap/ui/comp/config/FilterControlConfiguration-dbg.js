/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides control sap.ui.comp.config.ControlConfigurationBase.
sap.ui.define(['sap/ui/comp/config/ControlConfigurationBase'], function(ControlConfigurationBase) {
	"use strict";

	/**
	 * Constructor for a new <code>FilterControlConfiguration</code>
	 *
	 * @param {string} [sID] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class The <code>FilterControlConfiguration</code> can be used to generate the dynamic date range control used for filtering the smart table.
	 * @extends sap.ui.comp.config.ControlConfigurationBase
	 * @since 1.126.0
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.config.FilterControlConfiguration
	 */
	const FilterControlConfiguration = ControlConfigurationBase.extend("sap.ui.comp.config.FilterControlConfiguration", /** @lends sap.ui.comp.config.FilterControlConfiguration */
	{
		metadata: {
			library: "sap.ui.comp"
		}
	});

	return FilterControlConfiguration;

});
