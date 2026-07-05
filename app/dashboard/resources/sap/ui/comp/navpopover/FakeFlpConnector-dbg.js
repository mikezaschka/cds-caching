/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	'sap/ui/thirdparty/jquery', './Factory'
], function(jQuery, Factory) {
	"use strict";

	/**
	 * @namespace FakeFlpConnector.
	 * @name sap.ui.comp.navpopover.FakeFlpConnector
	 * @author SAP SE
	 * @version 1.136.0
	 * @private
	 * @since 1.58.0
	 */
	function FakeFlpConnector() {}

	function getURLParsing(oSetting) {
		return {
			parseShellHash: function(sIntent) {
				var fnFindAction = function(aLinks) {
					var aLink = aLinks.filter(function(oLink) {
						return oLink.intent === sIntent;
					});
					return aLink[0];
				};
				for ( var sSemanticObject in oSetting) {
					var oLink = fnFindAction(oSetting[sSemanticObject].links);
					if (oLink) {
						return {
							semanticObject: sSemanticObject,
							action: oLink.action
						};
					}
				}
				return {
					semanticObject: null,
					action: null
				};
			}
		};
	}

	function getNavigationService(oSetting) {
		return {
			getHref: function(oTarget) {
				if (!oTarget || !oTarget.target || !oTarget.target.shellHash) {
					return Promise.resolve(null);
				}
				return Promise.resolve(oTarget.target.shellHash);
			},
			getSemanticObjects: function() {
				var aSemanticObjects = [];
				for (var sSemanticObject in oSetting) {
					aSemanticObjects.push(sSemanticObject);
				}
				return Promise.resolve(aSemanticObjects);
			},
			getLinks: function(aLinkFilters) {
				var aLinks = [];
				if (!Array.isArray(aLinkFilters)) {
					aLinks = oSetting[aLinkFilters.semanticObject] ? oSetting[aLinkFilters.semanticObject].links : [];
				} else {
					aLinkFilters.forEach(function(oParam) {
						aLinks.push(oSetting[oParam.semanticObject] ? oSetting[oParam.semanticObject].links : []);
					});
				}
				return Promise.resolve(aLinks);
			},
			getPrimaryIntent: function(sSemanticObject, oLinkFilter) {
				let oLink = null;
				const aSemanticObjectLinks = oSetting[sSemanticObject]?.links;
				if (aSemanticObjectLinks === undefined) {
					return Promise.resolve(oLink);
				}

				let aLinks = aSemanticObjectLinks.filter((oSemanticObjectLink) => {
					return oSemanticObjectLink.tags?.includes("primaryAction");
				});

				if (aLinks.length === 0) {
					aLinks = aSemanticObjectLinks.filter((oSemanticObjectLink) => {
						return oSemanticObjectLink.action === "displayFactSheet";
					});
				}

				if (aLinks.length === 0) {
					return Promise.resolve(oLink);
				}

				oLink = aLinks.sort((oLink, oOtherLink) => {
					if (oLink.intent === oOtherLink.intent) {
						return 0;
					}

					return oLink.intent < oOtherLink.intent ? -1 : 1;
				})[0];

				return Promise.resolve(oLink);
			}
		};
	}

	FakeFlpConnector.enableFakeConnector = function(oSetting) {
		if (FakeFlpConnector.getServiceReal) {
			return;
		}
		FakeFlpConnector.getServiceReal = Factory.getService;
		FakeFlpConnector.getServiceAsyncReal = Factory.getServiceAsync;
		Factory.getService = FakeFlpConnector._createFakeService(oSetting);
		Factory.getServiceAsync = (sServiceName) => Factory.getService(sServiceName, true);
	};

	FakeFlpConnector._createFakeService = function(oSetting) {
		return function(sServiceName, bAsync) {
			switch (sServiceName) {
				case "URLParsing":
					return bAsync ? Promise.resolve(getURLParsing(oSetting)) : getURLParsing(oSetting);
				case "Navigation":
					return bAsync ? Promise.resolve(getNavigationService(oSetting)) : getNavigationService(oSetting); // mock this due to RTAHandler
				default:
					return FakeFlpConnector.getServiceReal(sServiceName);
			}
		};
	};

	FakeFlpConnector.disableFakeConnector = function() {
		if (FakeFlpConnector.getServiceReal) {
			Factory.getService = FakeFlpConnector.getServiceReal;
			Factory.getServiceAsync = FakeFlpConnector.getServiceAsyncReal;
			FakeFlpConnector.getServiceReal = undefined;
			FakeFlpConnector.getServiceAsyncReal = undefined;
		}
	};

	return FakeFlpConnector;

}, true);
