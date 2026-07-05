/*!
 * OpenUI5
 * (c) Copyright 2026 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define([
	"sap/ui/test/Opa5",
	"sap/ui/test/matchers/PropertyStrictEquals",
    "sap/ui/test/actions/Press"
], function(
	Opa5,
	PropertyStrictEquals,
	Press
) {
	"use strict";

	Opa5.createPageObjects({
		util: {
			actions: {
				iPressButton: function(sTitle){
					return this.waitFor({
						controlType: "sap.m.Button",
						matchers: [
							// new Ancestor(aVHDialogs[0], false),
							new PropertyStrictEquals({
								name: "text",
								value: sTitle
							})
						],
						actions: new Press()
				   });
				}

			}
		}
	});

});
