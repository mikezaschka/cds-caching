/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	'sap/ui/comp/odata/MetadataAnalyser',
	'sap/ui/comp/library'
], function(
	MetadataAnalyser,
	library
) {
	"use strict";

	/**
	 * Constructs a utility class to analyze the OData metadata document ($metadata) when analytical parameters are available to resolve SAP annotations.<br>
	 * class.
	 *
	 * This module is only for internal use!
	 *
	 * @constructor
	 * @param {string} oResourceRootUri - The URL of the resource or ODataModel
	 * @version 1.136.0
	 * @private
	 * @extends sap.ui.comp.odata.MetadataAnalyser
	 * @alias {sap.ui.comp.odata.AnalyticalAnalyser} the Analytical MetadataAnalyser implementation.
	 */
	var AnalyticalAnalyser = function(oResourceRootUri){
		MetadataAnalyser.apply(this, arguments);
	};

	AnalyticalAnalyser.prototype = Object.create(MetadataAnalyser.prototype);
	Object.assign(AnalyticalAnalyser, MetadataAnalyser);

	/**
	 * Returns the OData entity set with the given simple name from the default entity container.
	 *
	 * @param {string} sEntitySetName the entity set name from value list annotation collection path.
	 * @returns {array} Returns the OData parameterized and results entity sets.
	 * @private
	 */
	AnalyticalAnalyser.prototype.getVLEntitySets = function(sEntitySetName) {
		var oParametersEntitySet,
			oParametersEntityType,
			oAssociationSetEnd,
			aNavigationParts,
			sParametersEntitySetPart,
			sParametersPropertyPart,
			aEntitySets = MetadataAnalyser.prototype.getVLEntitySets.apply(this, arguments),
			oEntitySet = Array.isArray(aEntitySets) && aEntitySets[0];

		if (!oEntitySet &&
			typeof sEntitySetName === "string" &&
			this._containsNavigation(sEntitySetName)) {
				aNavigationParts = sEntitySetName.split("/");
				sParametersEntitySetPart = aNavigationParts[0];
				sParametersPropertyPart = aNavigationParts[1];
				oParametersEntitySet = this._oMetaModel.getODataEntitySet(sParametersEntitySetPart);

				if (oParametersEntitySet &&
					this.isSemanticParameters(oParametersEntitySet.entityType) &&
					sParametersPropertyPart) {
						oParametersEntityType = this._oMetaModel.getODataEntityType(oParametersEntitySet.entityType);
						oAssociationSetEnd = this._oMetaModel.getODataAssociationSetEnd(oParametersEntityType, sParametersPropertyPart);

						if (oAssociationSetEnd) {
							oEntitySet = this._oMetaModel.getODataEntitySet(oAssociationSetEnd.entitySet);
						}
				}

		}

		return [oEntitySet, oParametersEntitySet];
	};

	/**
	 * @inheritDoc
	 */
	AnalyticalAnalyser.prototype.getVLProperty = function(oProperty, aEntitySets) {
		var aPropertyParts,
			sParametersPropertyPart,
			bContainsNavigation,
			sValueListProperty,
			oParametersEntitySet = aEntitySets[1];

		if (oProperty &&
			oParametersEntitySet &&
			this.isSemanticParameters(oParametersEntitySet.entityType)) {

			bContainsNavigation = this._containsNavigation(oProperty.String);
			if (bContainsNavigation) {
				aPropertyParts = oProperty.String.split("/");
				sParametersPropertyPart = aPropertyParts[1];
				if (sParametersPropertyPart) {
					sValueListProperty = library.ANALYTICAL_PARAMETER_PREFIX + sParametersPropertyPart;
				}
			}
		}

		if (!sValueListProperty) {
			sValueListProperty = MetadataAnalyser.prototype.getVLProperty.call(this, oProperty);
		}

		return sValueListProperty;
	};

	AnalyticalAnalyser.prototype._containsNavigation = function(sNavigation){
		return typeof sNavigation === "string" && sNavigation.indexOf("/") > 0 && !sNavigation.endsWith("/");
	};

	AnalyticalAnalyser.prototype.isSemanticParameters = function(sPath) {
		var oEntityType;
		if (sPath && this._oMetaModel) {
			oEntityType = this._oMetaModel.getODataEntityType(sPath);
			if (oEntityType) {
				return oEntityType["sap:semantics"] === "parameters";
			}
		}

		return false;
	};

	return AnalyticalAnalyser;

}, /* bExport= */true);
