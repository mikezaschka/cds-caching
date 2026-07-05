/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/comp/odata/MetadataAnalyser"
], function (
	BaseObject,
	MetadataAnalyser
) {
	"use strict";
	/**
	 * FlexibilityDelegate class that provides useful functionality for RTA.
	 * @namespace
	 * @alias sap.ui.comp.delegates.Label
	 * @private
	 * @ui5-restricted sap.ui.comp
	 * @since 1.135
	 */
	const Delegate = BaseObject.extend("sap.ui.comp.delegates.Label", /** @lends sap.ui.comp.delegates.Label */ {
		constructor: function (oSettings) {
			BaseObject.apply(this, arguments);
			this.bSingle = oSettings?.singleRename;
		}
	});

	const getProperties = (oModel, sEntitySet, sPropertyName) => {
		const oAnalyzer = new MetadataAnalyser(oModel),
			aProperties = oAnalyzer.getFieldsByEntitySetName(sEntitySet)?.filter((o) => {
					return o.visible && (!sPropertyName || (sPropertyName === o.name));
			});

		return aProperties?.map((oProperty) => {
			return {
				propertyName: oProperty.name,
				annotationPath: `/dataServices/schema/0/entityType/[\${name}==='${oProperty.entityName}']/property/[\${name}==='${oProperty.name}']/com.sap.vocabularies.Common.v1.Label`,
				currentValue: oProperty.fieldLabel
			};
		});
	};

	Delegate.prototype.getAnnotationsChangeInfo = function (oControl) {
		let sPropertyName;
		const sEntitySet = oControl.getFlexConfig()?.entitySetName;

		if (oControl && oControl.isA("sap.ui.comp.smartform.GroupElement") && this.bSingle) {
			const oSmartField = oControl._getFieldRelevantForLabel();
			sPropertyName = oSmartField?.getControlFactory()?.getEdmProperty()?.name;
		}

		return {
			serviceUrl: oControl.getModel().getServiceUrl(),
			properties: getProperties(oControl.getModel(), sEntitySet, sPropertyName)
		};
	};
	return Delegate;
});
