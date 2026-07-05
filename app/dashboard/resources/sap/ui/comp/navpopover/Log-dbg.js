/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides control sap.ui.comp.navpopover.Log.
sap.ui.define(["sap/base/i18n/Localization", 'sap/ui/base/Object', "sap/ui/core/Locale", 'sap/ui/thirdparty/jquery'], function(Localization, BaseObject, Locale, jQuery) {
	"use strict";

	/**
	 * Constructor for a new Log.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * @class tbd
	 * @extends sap.ui.base.Object
	 * @constructor
	 * @private
	 * @since 1.58.0
	 * @alias sap.ui.comp.navpopover.Log
	 * @deprecated since version 1.121
	 */
	var Log = BaseObject.extend("sap.ui.comp.navpopover.Log", /** @lends sap.ui.comp.navpopover.Log.prototype */
	{
		// Structure of log object:
		// {
		//    semanticObjects: [
		//       SalesOrder: {
		//          attributes: {
		//			   Id: {
		//                transformations: [{
		//                   value: <any>
		//                   description: <string>,
		//                   reason: <string>
		//                }]
		//			},
		//		    intents: [{
		//             text: <string>,
		//             intent: <string>
		//          }]
		//       }
		//    ],
		//    intents: [{
		//             text: <string>,
		//             intent: <string>
		//    }]
		// }
		constructor: function() {
			this.reset();
		}
	});
	Log.prototype.reset = function() {
		this._oLog = {
			semanticObjects: [],
			intents: []
		};
		return this;
	};
	Log.prototype.createSemanticObjectStructure = function(sSemanticObject) {
		this._oLog.semanticObjects[sSemanticObject] = {
			attributes: {},
			intents: []
		};
	};
	Log.prototype.addIntent = function(oIntent) {
		this._oLog.intents.push(oIntent);
		return this;
	};
	Log.prototype.addSemanticObjectAttribute = function(sSemanticObject, sAttributeName, oAttribute) {
		if (!this._oLog.semanticObjects[sSemanticObject]) {
			this.createSemanticObjectStructure(sSemanticObject);
		}
		this._oLog.semanticObjects[sSemanticObject].attributes[sAttributeName] = oAttribute;
		return this;
	};
	Log.prototype.addSemanticObjectIntent = function(sSemanticObject, oIntent) {
		if (!this._oLog.semanticObjects[sSemanticObject]) {
			this.createSemanticObjectStructure(sSemanticObject);
		}
		this._oLog.semanticObjects[sSemanticObject].intents.push(oIntent);
		return this;
	};
	Log.prototype.updateSemanticObjectAttributes = function(sSemanticObject, oSemanticAttributesOld, oSemanticAttributesNew) {
		if (!this._oLog.semanticObjects[sSemanticObject]) {
			this.createSemanticObjectStructure(sSemanticObject);
		}
		var aTransformations, oTransformationLast;
		var aAttributesNew = Object.keys(oSemanticAttributesNew);
		for ( var sAttributeNew in oSemanticAttributesNew) {
			if (this._oLog.semanticObjects[sSemanticObject].attributes[sAttributeNew]) {
				aTransformations = this._oLog.semanticObjects[sSemanticObject].attributes[sAttributeNew].transformations;
				oTransformationLast = aTransformations[aTransformations.length - 1];
				if (oSemanticAttributesNew[sAttributeNew] !== oTransformationLast["value"]) {
					this._oLog.semanticObjects[sSemanticObject].attributes[sAttributeNew].transformations.push({
						value: oSemanticAttributesNew[sAttributeNew],
						description: "\u2139 Value of the attribute has been changed in an event handler.",
						reason: "\ud83d\udd34 Is changed in the event handler of the event BeforePopoverOpens for the SmartLink control. Please check the implementation if the result is not what you expected."
					});
				}
			} else {
				this.addSemanticObjectAttribute(sSemanticObject, sAttributeNew, {
					transformations: [
						{
							value: oSemanticAttributesNew[sAttributeNew],
							description: "\u2139 The attribute has been added in an event handler.",
							reason: "\ud83d\udd34 Is added in the event handler of the event BeforePopoverOpens for the SmartLink control. Please check the implementation if the result is not what you expected."
						}
					]
				});
			}
		}

		for ( var sAttributeOld in oSemanticAttributesOld) {
			if (aAttributesNew.indexOf(sAttributeOld) < 0 && this._oLog.semanticObjects[sSemanticObject].attributes[sAttributeOld]) {
				this._oLog.semanticObjects[sSemanticObject].attributes[sAttributeOld].transformations.push({
					value: undefined,
					description: "\u2139 The attribute has been removed in an event handler.",
					reason: "\ud83d\udd34 Is removed in the event handler of the event BeforePopoverOpens for the SmartLink control. Please check the implementation if the result is not what you expected."
				});
			}
		}
		return this;
	};
	Log.prototype.getFormattedText = function() {
		var fnGetReadableValue = function(oValue) {
			return (typeof oValue === "string") ? "'" + oValue + "'" : oValue;
		};
		var fnResolveTransformations = function(aTransformations, sAttributeName) {
			var oResult = {
				value: "\u2022\u0020" + sAttributeName + " : ",
				description: ""
			};
			aTransformations.forEach(function(oTransformation, iIndex) {
				oResult.value = oResult.value + (iIndex > 0 ? "\u0020 \u279c \u0020" : "") + fnGetReadableValue(oTransformation["value"]);
				oResult.description = oResult.description + "\u2026 \u0020 " + oTransformation["description"] + "\n";
				if (oTransformation["reason"]) {
					oResult.description = oResult.description + "\u2026 \u0020 " + oTransformation["reason"] + "\n";
				}
			});
			return oResult;
		};
		var fnResolveIntents = function(aIntents) {
			var sIntents = "";
			aIntents.forEach(function(oIntent) {
				sIntents += "\u2022\u0020'" + oIntent.text + "' : " + oIntent.intent + "\n";
			});
			return sIntents;
		};
		var fnSortByText = function(aArray) {
			try {
				var sLanguage = new Locale(Localization.getLanguageTag()).toString();
				if (typeof window.Intl !== 'undefined') {
					var oCollator = window.Intl.Collator(sLanguage, {
						numeric: true
					});
					aArray.sort(function(a, b) {
						return oCollator.compare(a, b);
					});
				} else {
					aArray.sort(function(a, b) {
						return a.localeCompare(b, sLanguage, {
							numeric: true
						});
					});
				}
			} catch (oException) {
				// this exception can happen if the configured language is not convertible to BCP47 -> getLocale will deliver an exception
			}
		};
		var sText = "";
		for ( var sSemanticObject in this._oLog.semanticObjects) {
			sText = sText + "\n\u2b24" + " " + sSemanticObject + "\n";
			if (jQuery.isEmptyObject(this._oLog.semanticObjects[sSemanticObject].attributes)) {
				sText += "\u2026\u2026 \u0020\ud83d\udd34 No semantic attributes available for semantic object " + sSemanticObject + ". Please be aware " + "that without semantic attributes no URL parameters can be created.\n";
			} else {
				var aSemanticAttributes = Object.keys(this._oLog.semanticObjects[sSemanticObject].attributes);
				fnSortByText(aSemanticAttributes);

				for (var i = 0; i < aSemanticAttributes.length; i++) {
					var sAttributeName = aSemanticAttributes[i];
					var oTexts = fnResolveTransformations(this._oLog.semanticObjects[sSemanticObject].attributes[sAttributeName].transformations, sAttributeName);
					sText += oTexts.value + "\n";
					sText += oTexts.description;
				}
			}
			if (this._oLog.semanticObjects[sSemanticObject].intents.length) {
				sText += "\nIntents returned by FLP for semantic object " + sSemanticObject + ":\n";
				sText += fnResolveIntents(this._oLog.semanticObjects[sSemanticObject].intents);
			}
		}
		if (this._oLog.intents.length) {
			sText += "\nIntents returned by event handler:\n";
			sText += fnResolveIntents(this._oLog.intents);
		}

		return sText;
	};
	return Log;

});