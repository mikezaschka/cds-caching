/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
/**
 * Defines support rules of the SmartField control of sap.ui.layout library.
 */
sap.ui.define([
	"sap/ui/core/Element",
	"sap/ui/core/LabelEnablement",
	"sap/ui/comp/odata/MetadataAnalyser",
	"sap/ui/support/library"
],
	(
		Element,
		LabelEnablement,
		MetadataAnalyser,
		SupportLib
	) => {
	"use strict";

	// shortcuts
	const Categories = SupportLib.Categories, // Accessibility, Performance, Memory, ...
		  Severity = SupportLib.Severity, // Hint, Warning, Error
		  Audiences = SupportLib.Audiences; // Control, Internal, Application

	//**********************************************************
	// Rule Definitions
	//**********************************************************

	/* eslint-disable no-lonely-if */

	const oLabelRule = {
		id: "smartFieldLabel",
		audiences: [Audiences.Application],
		categories: [Categories.Usability],
		enabled: true,
		minversion: "1.48",
		title: "SmartField: Use of SmartLabel",
		description: "SmartField must be labelled by the SmartLabel control, not by the sap.m.Label control",
		resolution: "Use a SmartLabel control to label the SmartField control",
		resolutionurls: [{
				text: "API Reference: SmartField",
				href:"https://ui5.sap.com/#/api/sap.ui.comp.smartfield.SmartField"
			}],
		check: (oIssueManager, oCoreFacade, oScope) => {
			oScope.getElementsByClassName("sap.ui.comp.smartfield.SmartField").forEach(function(oSmartField) {
				const sId = oSmartField.getId(),
					  aLabels = LabelEnablement.getReferencingLabels(oSmartField);

				aLabels.forEach((sLabelID) => {
					const oLabel = Element.getElementById(sLabelID);
					if (!oLabel.isA("sap.ui.comp.smartfield.SmartLabel")) {
						oIssueManager.addIssue({
							severity: Severity.Medium,
							details: `SmartField ${sId} labelled by wrong Label.`,
							context: {
								id: oLabel.getId()
							}
						});
					}
				});

			});
		}
	};

	const oValueBindingContext = {
		id: "smartFieldValueBindingContext",
		audiences: [Audiences.Application],
		categories: [Categories.Bindings],
		minversion: "1.60",
		async: false,
		title: "SmartField: the value property is bound but there is no binding context available",
		description: `When the value property of the SmartField control is bound but there is no binding context
			available, the control can't resolve its service metadata or property values so the control behaves as if it
			were used without data binding and service metadata. This will result in a control without value.`,
		resolution: "Make sure the control has binding context",
		check: (oIssueManager, oCoreFacade, oScope) => {
			oScope.getElementsByClassName("sap.ui.comp.smartfield.SmartField").filter(function(oSmartField) {
				return oSmartField.isBound("value");
			}).forEach((oSmartField) => {
				const sId = oSmartField.getId();
				if (!oSmartField.getBindingContext()) {
					oIssueManager.addIssue({
						severity: Severity.High,
						details: `SmartField ${sId} has its value property bound but its binding context is undefined.`,
						context: {id: sId}
					});
				}
			});
		}
	};

	const oNotVisible = {
		id: "smartFieldNotVisible",
		audiences: [Audiences.Application],
		categories: [Categories.Bindings],
		minversion: "1.114",
		async: false,
		title: "SmartField: not visualizing in the application",
		description: "The inner controls are not created or the SmartField is not visible at all",
		resolution: "Make sure the control has a binding context, value property binding, and the visible property is set to true",
		check: (oIssueManager, oCoreFacade, oScope) => {
			oScope.getElementsByClassName("sap.ui.comp.smartfield.SmartField").forEach((oSmartField) => {
				const aDetails = [],
					  bHasBindingContext = oSmartField.getBindingContext(),
					  bHasValuePropertyBinding = oSmartField.isBound("value"),
					  bIsVisible = oSmartField.getVisible();

				if (!bHasBindingContext) {
					aDetails.push("Valid Binding Context");
				}

				if (!bHasValuePropertyBinding) {
					aDetails.push("Valid 'value' property Binding");
				}

				if (bHasBindingContext && bHasValuePropertyBinding && !bIsVisible) {
					aDetails.push("its 'visible' property is true");
				}

				if (aDetails.length){
					oIssueManager.addIssue({
						severity: Severity.High,
						details: `SmartField doesn't meet the requirements for: ${aDetails.join(", ")}`,
						context: {id: oSmartField.getId()}
					});
				}
			});
		}
	};

	const oLocalTimeZoneOnly = {
		id: "smartFieldLocalTimeZoneOnly",
		audiences: [Audiences.Application],
		categories: [Categories.Bindings],
		minversion: "1.114",
		async: false,
		title: "SmartField: DateTimeTimezone type",
		description: "Local timezone always taken",
		resolution: "Make sure that there is a time zone value",
		check: (oIssueManager, oCoreFacade, oScope) => {
			oScope.getElementsByClassName("sap.ui.comp.smartfield.SmartField").forEach((oSmartField) => {
				const oFactory = oSmartField.getControlFactory();

				if (oFactory.isA("sap.ui.comp.smartfield.ODataControlFactory")) {
					const oEdmProperty = oFactory.getEdmProperty(),
						  sTimeZonePath = oEdmProperty && MetadataAnalyser.getTimezonePropertyPath(oEdmProperty),
						  mTimeZoneValue = oSmartField.getBindingContext().getProperty(sTimeZonePath);

					if (sTimeZonePath && !mTimeZoneValue) {
						oIssueManager.addIssue({
							severity: Severity.High,
							details: "SmartField has Timezone annotation but doesn't have time zone value in the current Binding Context.",
							context: {id: oSmartField.getId()}
						});
					}
				}
			});
		}
	};

	const oOneWayBinding = {
		id: "oneWayBinding",
		audiences: [Audiences.Application],
		categories: [Categories.Bindings],
		minversion: "1.114",
		async: false,
		title: "SmartField: OneWay binding is not supported",
		description: "SmartField is designed to work in a TwoWay binding.",
		resolution: "Either config your model or remove any formatter from the 'value' property binding.",
		check: (oIssueManager, oCoreFacade, oScope) => {
			oScope.getElementsByClassName("sap.ui.comp.smartfield.SmartField").filter((oSmartField) => {
				return oSmartField.isBound("value");
			}).forEach((oSmartField) => {
				const sId = oSmartField.getId();
				if (oSmartField.getBinding("value").getBindingMode() === "OneWay") {
					oIssueManager.addIssue({
						severity: Severity.High,
						details: `SmartField ${sId} has its value property bound with a OneWay binding.`,
						context: {id: sId}
					});
				}
			});
		}
	};

	const oValueListEntitySetLoaded = {
		id: "valueListEntitySetLoaded",
		audiences: [Audiences.Application],
		categories: [Categories.Bindings],
		minversion: "1.117",
		async: false,
		title: "SmartField value list annotations are incorrect or not loaded",
		description: "When a SmartField is bound to a property annotated with a value list annotation but the collection path of this value list annotation points to a EntitySet->EntityType which is not loaded the SmartField will randomly fail",
		resolution: "Check your backend service why the annotation is not loaded.",
		check: (oIssueManager, oCoreFacade, oScope) => {
			oScope.getElementsByClassName("sap.ui.comp.smartfield.SmartField").forEach((oSmartField) => {
				const sId = oSmartField.getId(),
					  oFactory = oSmartField.getControlFactory(),
					  oMetadata = oFactory?.getMetaData();

				if (!oMetadata) {
					return;
				}

				const {property, valueListAnnotation, valueListEntitySet, valueListEntityType} = oMetadata.property,
					  bMissing = !valueListAnnotation || !valueListEntitySet || !valueListEntityType;

				if (property["com.sap.vocabularies.Common.v1.ValueList"] && bMissing) {
					oIssueManager.addIssue({
						severity: Severity.High,
						details: "SmartField " + sId + " has a value list annotation but either the value list EntitySet or the value list EntityType are not loaded.",
						context: {id: sId}
					});
				}
			});
		}
	};

	const oValueListMissing = {
		id: "valueListAnnotationMissing",
		audiences: [Audiences.Application],
		categories: [Categories.Bindings],
		minversion: "1.117",
		async: false,
		title: "SmartField value list annotations is missing",
		description: 'SmartField bound property is annotated with sap:value-list="standard" but the annotation is not loaded.',
		resolution: "Check your backend service why the annotation is not loaded or any additional local annotation file.",
		check: (oIssueManager, oCoreFacade, oScope) => {
			oScope.getElementsByClassName("sap.ui.comp.smartfield.SmartField").forEach((oSmartField) => {
				const sId = oSmartField.getId(),
					  oFactory = oSmartField.getControlFactory(),
					  oMetadata = oFactory?.getMetaData();

				if (!oMetadata) {
					return;
				}

				const property = oMetadata.property.property;

				if (
					property["sap:value-list"] === "standard" &&
					!property["com.sap.vocabularies.Common.v1.ValueList"]
				) {
					oIssueManager.addIssue({
						severity: Severity.High,
						details: `SmartField property ${sId} has a sap:value-list="standard" but the value list annotation is not loaded.`,
						context: {id: sId}
					});
				}
			});
		}
	};

	const oValueListInParams = {
		id: "valueListInParams",
		audiences: [Audiences.Application],
		categories: [Categories.Functionality],
		minversion: "1.118",
		async: false,
		title: "SmartField value list annotations In/InOut parameters doesn't have robust configuration",
		description: "We have added a new rule that checks if the ValueList annotation have robust In/InOut parameters configuration. All of the ValueList EntityType keys should be included as In/InOut parameters, so that the server is always responding with only one entity when we send request to get TextArrangement description.",
		resolution: "Set all of the ValueList EntityType keys as In/InOut parameters.",
		check: (oIssueManager, oCoreFacade, oScope) => {
			oScope.getElementsByClassName("sap.ui.comp.smartfield.SmartField").forEach((oSmartField) => {
				const sId = oSmartField.getId(),
					oFactory = oSmartField.getControlFactory(),
					oMetadata = oFactory?.getMetaData();

				if (!oMetadata?.property?.valueListAnnotation) {
					return;
				}

				const oVLAnnotation = oMetadata.property.valueListAnnotation,
					aVLKeys = oVLAnnotation.keys,
					oVLInPrams = Object.values(oVLAnnotation.inParams);

				for (let iIndex = 0; iIndex < aVLKeys.length; iIndex++) {
					const sKey = aVLKeys[iIndex];
					if (!oVLInPrams.includes(sKey)) {
						oIssueManager.addIssue({
							severity: Severity.Medium,
							details: `SmartField with Id ${sId} has a ValueList Annotation which In/InOut parameters does not match the keys of the Collection's EntityType.`,
							context: {id: sId}
						});
						break;
					}
				}
			});
		}
	};

		const oValueHelpExpand = {
			id: "valueListWithInvalidNavigation",
			audiences: [Audiences.Application],
			categories: [Categories.Functionality],
			minversion: "1.118",
			async: false,
			title: "SmartField: ValueList with invalid navigation",
			description: "Value list property has a sap:text annotation pointing to non-existing navigation property",
			resolution: "This should be corrected in your backend service or metadata",
			check: (oIssueManager, oCoreFacade, oScope) => {
				oScope.getElementsByClassName("sap.ui.comp.smartfield.SmartField").forEach((oSmartField) => {
					const oFactory = oSmartField.getControlFactory(),
						  oMetadata = oFactory?.getMetaData();

					if (!oMetadata?.property?.valueListAnnotation) {
						return;
					}

					const aVLProperties = oMetadata.property.valueListAnnotation.fields.map((oField) => oField.name),
						  oET = oMetadata.property.valueListEntityType;

					aVLProperties.forEach((sProperty) => {
						const oProperty = oET.property.find((o) => o.name === sProperty),
							  sText = oProperty["sap:text"];

						if (sText && sText.includes("/")) {
							const sNavProperty = sText.split("/")[0];

							if (!oET.navigationProperty || !oET.navigationProperty.find((o) => o.name === sNavProperty)) {
								oIssueManager.addIssue({
									severity: SupportLib.Severity.High,
									details: `SmartField: Value list has property "${sProperty}" with a sap:text annotation 
											pointing to non-existing navigation property "${sNavProperty}" in EntityType "${oET.name}"`,
									context: {id: oSmartField.getId()}
								});
							}
						}
					});
				});
			}
		};

	const oValueListMapping = {
		id: "oValueListMapping",
		audiences: [Audiences.Application],
		categories: [Categories.Functionality],
		minversion: "1.132",
		async: false,
		title: "SmartField: ValueList definition with missing Key->Text mapping",
		description: `Value list key property is missing Common.V1.Text annotation pointing to a description property. 
		This can render the SmartField unstable especially in TextOnly configuration where the field will be not able to store
		its value in the local model.`,
		resolution: "This should be corrected in your backend service or metadata",
		check: (oIssueManager, oCoreFacade, oScope) => {
			oScope.getElementsByClassName("sap.ui.comp.smartfield.SmartField").forEach((oSmartField) => {
				if (!oSmartField.isTextInEditModeSourceNotNone()) {
					return;
				}

				const oMetadata = oSmartField.getControlFactory()?.getMetaData(),
					  oKey = oMetadata?.property?.valueListKeyProperty;

				if (!oKey) {
					return;
				}

				if (!oKey["com.sap.vocabularies.Common.v1.Text"]?.Path) {
					oIssueManager.addIssue({
						severity: SupportLib.Severity.High,
						details: `SmartField: Value list key property "${oKey.name}" is missing Common.V1.Text annotation pointing to a description property`,
						context: {id: oSmartField.getId()}
					});
				}
			});
		}
	};

	return [
		oLabelRule,
		oValueBindingContext,
		oNotVisible,
		oLocalTimeZoneOnly,
		oOneWayBinding,
		oValueListEntitySetLoaded,
		oValueListMissing,
		oValueListInParams,
		oValueHelpExpand,
		oValueListMapping
	];

}, true);
