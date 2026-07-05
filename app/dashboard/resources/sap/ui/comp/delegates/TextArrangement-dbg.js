/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define([
	"sap/ui/comp/library",
	"sap/ui/base/Object",
	"sap/ui/comp/odata/MetadataAnalyser"
], function (
	library,
	BaseObject,
	MetadataAnalyser
) {
	"use strict";
	/**
	 * FlexibilityDelegate class that provides useful functionality for RTA.
	 * @namespace
	 * @alias sap.ui.comp.delegates.TextArrangement
	 * @private
	 * @ui5-restricted sap.ui.comp
	 * @since 1.135
	 */
	const Delegate = BaseObject.extend("sap.ui.comp.delegates.TextArrangement", /** @lends sap.ui.comp.delegates.TextArrangement */ {
		constructor: function () {
			BaseObject.apply(this, arguments);
		}
	});

	const sDefaultFixed = library.smartfield.DisplayBehaviour.descriptionOnly,
		sDefaultInput = library.smartfield.DisplayBehaviour.descriptionAndId;

	const hasValueListText = (sProperty, oAnnotation) => {
		if (!oAnnotation) {
			return false;
		}

		// ValueList fields find primary InOut parameter
		const oPrimary = oAnnotation.annotation?.Parameters.find((oParam) => {
			return oParam.LocalDataProperty?.PropertyPath === sProperty &&
				oParam.RecordType === "com.sap.vocabularies.Common.v1.ValueListParameterInOut";
		});
		const sVLProperty = oPrimary?.ValueListProperty?.String;

		if (!sVLProperty) {
			return false;
		}

		const oProperty = oAnnotation?.valueListFields.find((oField) => oField.name === sVLProperty);
		return !!oProperty["com.sap.vocabularies.Common.v1.Text"];
	};

	const getCurrentValue = (oItem) => {
		const oText = oItem["com.sap.vocabularies.Common.v1.Text"];

		let sValue = oItem["com.sap.vocabularies.UI.v1.TextArrangement"]?.EnumMember.split("/").pop();
		if (!sValue && oText) {
			sValue = oText["com.sap.vocabularies.UI.v1.TextArrangement"]?.EnumMember.split("/").pop();
		}

		return sValue;
	};

	const getProperties = function (oControl) {
		const oMetadataAnalyer = new MetadataAnalyser(oControl.getModel()),
			oDisplayType = {
				idOnly: "TextSeparate",
				descriptionAndId: "TextFirst",
				idAndDescription: "TextLast",
				descriptionOnly: "TextOnly"
			},
			aSupportedTypes = ["Edm.String"],
			aValueListLazyPromises = [],
			oFlexConfig = oControl.getFlexConfig(),
			oPropertiesForRTA = oMetadataAnalyer.getFieldsByEntitySetName(oFlexConfig.entitySetName);

		oPropertiesForRTA?.forEach(function (oItem) {
			if (aSupportedTypes.includes(oItem.type)) {
				aValueListLazyPromises.push({
					item: oItem,
					valueList: oMetadataAnalyer.getValueListAnnotationLazy(oItem.fullName)
				});
			}
		});

		return new Promise(function (resolve, reject) {
			Promise.all(aValueListLazyPromises.map(async (item) => ({
				...item,
				valueList: await item.valueList
			})))
				.then((results) => {
					const aProperties = [];

					results?.forEach(function (result) {
						const oItem = result.item,
							oProperty = {},
							oPrimaryValueListAnnotation = result?.valueList?.primaryValueListAnnotation,
							bIsCurrencyUom = MetadataAnalyser.isCurrencyCode(oItem) || MetadataAnalyser.isUnitOfMeasure(oItem);
						let sCurrentValue;
						const oPropertyText = oItem["com.sap.vocabularies.Common.v1.Text"];

						if (
							aSupportedTypes.includes(oItem.type) &&
							!bIsCurrencyUom &&
							oItem.visible &&
							(oPropertyText || oPrimaryValueListAnnotation)
						) {
							const sPropertyTextArrangement = MetadataAnalyser.hasTextArrangementAnnotation(oItem);

							let sValueListText,
								sValueListTextArrangement;

							if (oPrimaryValueListAnnotation) {
								sValueListTextArrangement = MetadataAnalyser.hasTextArrangementAnnotation(oPrimaryValueListAnnotation.valueListFields[0]);
								sValueListText = hasValueListText(oItem.name, oPrimaryValueListAnnotation);
							}

							const sEntitySetTextArrangement = oMetadataAnalyer.getTextArrangementValue(oMetadataAnalyer.getEntityTypeNameFromEntitySetName(oFlexConfig.entitySetName));

							if (sPropertyTextArrangement || sValueListTextArrangement || oPropertyText || sValueListText) {
								if (sPropertyTextArrangement) {
									sCurrentValue = getCurrentValue(oItem);
								} else if (sValueListTextArrangement) {
									sCurrentValue = getCurrentValue(oPrimaryValueListAnnotation);
								} else if (sEntitySetTextArrangement) {
									sCurrentValue = oDisplayType[sEntitySetTextArrangement];
								} else if (oPropertyText || sValueListText) {
									if (oItem["com.sap.vocabularies.Common.v1.ValueListWithFixedValues"] || oItem["sap:value-list"] === "fixed-values") {
										sCurrentValue = oDisplayType[sDefaultFixed];
									} else {
										sCurrentValue = oDisplayType[sDefaultInput];
									}
								}

								oProperty.propertyName = oItem["sap:label"] || oItem["com.sap.vocabularies.Common.v1.Label"]?.String;
								if (oPropertyText) {
									oProperty.annotationPath = `/dataServices/schema/0/entityType/[\${name}==='${oItem.entityName}']/property/[\${name}==='${oItem.name}']/com.sap.vocabularies.Common.v1.Text/com.sap.vocabularies.UI.v1.TextArrangement`;
								} else {
									oProperty.annotationPath = `/dataServices/schema/0/entityType/[\${name}==='${oItem.entityName}']/property/[\${name}==='${oItem.name}']/com.sap.vocabularies.UI.v1.TextArrangement`;
								}
								oProperty.currentValue = { EnumMember: "com.sap.vocabularies.UI.v1.TextArrangementType/" + sCurrentValue };
								aProperties.push(oProperty);
							}
						}
					});

					resolve(aProperties);
				});
		});
	};

	Delegate.getAnnotationsChangeInfo = async function (oControl) {
		const oTextArrangementTypes = {
			[library.TextArrangementType.TextOnly]: "Text Only",
			[library.TextArrangementType.TextFirst]: "Text First",
			[library.TextArrangementType.TextLast]: "Text Last",
			[library.TextArrangementType.TextSeparate]: "ID Only"
		},
			oProperties = await getProperties(oControl);

		return {
			serviceUrl: oControl.getModel().getServiceUrl(),
			properties: oProperties,
			possibleValues: Object.keys(oTextArrangementTypes).map((sKey) => ({
				key: { EnumMember: sKey },
				text: oTextArrangementTypes[sKey]
			})),
			preSelectedProperty: "" // if the action is triggered from a control that corresponds to a property, only this one will be shown in the Dialog initially (search field populated with this string)
		};
	};

	return Delegate;
});
