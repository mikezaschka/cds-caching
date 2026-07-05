/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define([
	"sap/ui/test/Opa5",
	"./TestUtils",
	"./smarttable/TestObjects",
	"./smartchart/TestObjects",
	"./smartfield/TestObjects",
	"./smartfilterbar/TestObjects",
	"./smartlink/TestObjects",
	"./smartvariants/TestObjects",
	"./tokenizer/TestObjects",
	"./valuehelpdialog/TestObjects"
], function(
	Opa5,
	TestUtils
) {
	"use strict";

	Opa5.createPageObjects({
		onTheCompTestLibrary: {
			// Define functionality that can be used on the global Given, When, Then constructs
			actions: {
				iStartMyApp: function (sAppUrl) {
					return this.iStartMyAppInAFrame(sAppUrl);
				},
				iEnsureMyAppIsRunning: function (sUrl) {
					var sAppUrl = sUrl
						? sUrl
						: Opa5.getTestLibConfig(TestUtils.COMP_TEST_LIBRARY_NAME).appUrl; // Gets the url from test library config settings

					if (this._myApplicationIsRunning && sAppUrl !== this._myAppUrl){
						this.iStopMyApp();
					}

					if (!this._myApplicationIsRunning) {
						this.iStartMyApp(sAppUrl);
						this._myApplicationIsRunning = true;
						this._myAppUrl = sAppUrl;
					}
				},
				iStopMyApp: function(){
					this._myApplicationIsRunning = false;
					this._myAppUrl = null;
					this.iTeardownMyApp();
				}
			},
			assertions: {
				/**
				 * Checks if the test app was started
				 */
				iCheckMyAppIsRunning: function () {
					Opa5.assert.strictEqual(
						this._myApplicationIsRunning,
						true,
						"The application should be running"
					);
				}
			}
		}
	});
});
