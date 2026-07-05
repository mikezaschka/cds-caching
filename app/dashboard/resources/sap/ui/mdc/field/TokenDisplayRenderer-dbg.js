/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define(['sap/ui/core/Renderer', 'sap/m/TokenRenderer'],
	(Renderer, TokenRenderer) => {
		"use strict";

		/**
		 * TokenDisplay renderer.
		 * @namespace
		 */
		const TokenDisplayRenderer = Renderer.extend(TokenRenderer);
		TokenDisplayRenderer.apiVersion = 2;

		TokenDisplayRenderer._setAttributes = function(oRm, oControl) {
			TokenRenderer._setAttributes(oRm, oControl);
			oRm.attr("delimiter", oControl.getProperty("_delimiter"));
		};

		return TokenDisplayRenderer;
	});