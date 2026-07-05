/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
/**
 * Defines support rules of the SmartLink control of sap.ui.comp library.
 */
sap.ui.define(["sap/base/Log", "sap/ui/support/library"], function(Log, SupportLib) {
	"use strict";

	//**********************************************************
	// Rule Definitions
	//**********************************************************

	/* eslint-disable no-lonely-if */

	var oSmartLinkRule = {
		id: "smartLinkCalculationOfSemanticAttributes",
		audiences: [
			SupportLib.Audiences.Application
		],
		categories: [
			SupportLib.Categories.Usability
		],
		minversion: "1.56",
		async: true,
		title: "SmartLink: calculation of semantic attributes",
		description: "This check is for information purposes only providing information which might be helpful in case of intent navigation issues",
		resolution: "See explanation for a specific semantic attribute marked with \ud83d\udd34 in the details section",
		resolutionurls: [
			{
				text: "API Reference: SmartLink",
				href: "https://ui5.sap.com/#/api/sap.ui.comp.navpopover.SmartLink"
			}
		],
		check: function(oIssueManager, oCoreFacade, oScope, fnResolve) {

			var iLogLevel = Log.getLevel();
			Log.setLevel(Log.Level.INFO);

			var aPromises = [];
			var aNavigationPopoverHandlers = [];
			var aSemanticObjects = [];

			oScope.getElementsByClassName("sap.ui.comp.navpopover.SmartLink").forEach(function(oSmartLink) {
				if (aSemanticObjects.indexOf(oSmartLink.getSemanticObject()) > -1) {
					return;
				}
				aSemanticObjects.push(oSmartLink.getSemanticObject());

				var oNavigationPopoverHandler = oSmartLink.getNavigationPopoverHandler();
				aNavigationPopoverHandlers.push(oNavigationPopoverHandler);
				aPromises.push(oNavigationPopoverHandler._initModel());
			});
			Promise.all(aPromises).then(function(aValues) {
				for (var i = 0; i < aValues.length; i++) {
					var oNavigationPopoverHandler = aNavigationPopoverHandlers[i];
					var sText = oNavigationPopoverHandler._getLogFormattedText();
					if (sText) {
						oIssueManager.addIssue({
							severity: SupportLib.Severity.Low,
							details: "Below you can see detailed information regarding semantic attributes which have been calculated for one or more semantic objects defined in a SmartLink control. Semantic attributes are used to create the URL parameters.\nAdditionally you can see all links containing the URL parameters.\n" + sText,
							context: {
								id: oNavigationPopoverHandler.getId()
							}
						});
					}
				}

				Log.setLevel(iLogLevel);
				fnResolve();
			});
		}
	};

	return [
		oSmartLinkRule
	];

}, true);
