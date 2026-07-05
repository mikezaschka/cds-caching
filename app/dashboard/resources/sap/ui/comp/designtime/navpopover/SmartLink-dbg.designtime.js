/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides the Design Time Metadata for the sap.ui.comp.navpopover.SmartLink control.
sap.ui.define([
	'sap/m/ObjectIdentifier',
	"sap/base/Log",
	"sap/ui/mdc/designtime/field/Field.designtime"
], function(ObjectIdentifier, Log, FieldDesignTime) {
	"use strict";

	(function() {
		ObjectIdentifier.getMetadata().loadDesignTime().then(function(oDesignTime) {
			if (oDesignTime.registerSettingsHandler) {
				oDesignTime.registerSettingsHandler({
					getStableElements: function(oObjectIdentifier) {
						let oSmartLink;
						oObjectIdentifier.fireEvent("ObjectIdentifier.designtime", {
							caller: "ObjectIdentifier.designtime",
							registerSmartLink: function(oSmartLink_) {
								oSmartLink = oSmartLink_;
							}
						});
						return FieldDesignTime.getStableElements(oSmartLink);
					},
					execute: function(oObjectIdentifier, mPropertyBag) {
						let oSmartLink;
						oObjectIdentifier.fireEvent("ObjectIdentifier.designtime", {
							caller: "ObjectIdentifier.designtime",
							registerSmartLink: function(oSmartLink_) {
								oSmartLink = oSmartLink_;
							}
						});
						return FieldDesignTime.actions.settings["sap.ui.mdc"].handler(oSmartLink, mPropertyBag);
					}
				});
			}
		});
	})();

	return {

		getStableElements: FieldDesignTime.getStableElements,
		actions: FieldDesignTime.actions,
		tool: FieldDesignTime.tool,
		annotations: {
			/**
			 * Maps properties of the annotated <code>EntityType</code> or sibling properties of the annotated property to properties of the
			 * Semantic Object. The <code>SmartLink</code> control can be created from the XML view or from the OData metadata.
			 * <i>XML Example of OData V4 with SemanticObjectMapping on Product/Name</i>
			 *
			 * <pre>
			 *  &lt;Annotations Target=&quot;ProductCollection.Product/Name&quot; xmlns=&quot;http://docs.oasis-open.org/odata/ns/edm&quot;&gt;
			 * 		&lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.SemanticObject&quot; String=&quot;SemanticObjectName&quot; /&gt;
			 * 		&lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.SemanticObjectMapping&quot;&gt;
			 * 			&lt;Collection&gt;
			 * 				&lt;Record&gt;
			 * 					&lt;PropertyValue Property=&quot;LocalProperty&quot; PropertyPath=&quot;SupplierId&quot; /&gt;
			 * 					&lt;PropertyValue Property=&quot;SemanticObjectProperty&quot; String=&quot;SupplierIdOfSemanticObjectName&quot; /&gt;
			 * 				&lt;/Record&gt;
			 * 			&lt;/Collection&gt;
			 * 		&lt;/Annotation&gt;
			 * 	&lt;/Annotations&gt;
			 * </pre>
			 */
			semanticObjectMapping: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "SemanticObjectMapping",
				target: [
					"Property"
				],
				defaultValue: null,
				appliesTo: [
					"text"
				],
				group: [
					"Behavior"
				],
				since: "1.48.0"
			},

			/**
			 * Renders the contact information inside the <code>NavigationPopover</code> control. The Contact annotation contains various
			 * <code>ContactType</code> which can be used for providing additional information for distinguishing between the contact details. List
			 * of enumeration types supported is listed below:
			 * <ul>
			 * <li><code>com.sap.vocabularies.Communication.v1.PhoneType/fax</code>: This enumeration type can be used for defining a fax number.</li>
			 * <li><code>com.sap.vocabularies.Communication.v1.PhoneType/work</code>: This enumeration type can be used for defining a work phone
			 * number.</li>
			 * <li><code>com.sap.vocabularies.Communication.v1.PhoneType/cell</code>: This enumeration type can be used for defining a mobile
			 * number.</li>
			 * <li><code>com.sap.vocabularies.Communication.v1.ContactInformationType/work"</code>: This enumeration type can be used for defining
			 * a work email address.</li>
			 * </ul>
			 * <i>XML Example of OData V4 with Contact Annotation</i>
			 *
			 * <pre>
			 *    &lt;Annotations Target=&quot;EntityTypeName.Supplier&quot;
			 *      xmlns=&quot;http://docs.oasis-open.org/odata/ns/edm&quot;&gt;
			 *       &lt;Annotation Term=&quot;com.sap.vocabularies.Communication.v1.Contact&quot;&gt;
			 *         &lt;Record&gt;
			 *           &lt;PropertyValue Property=&quot;fn&quot; Path=&quot;FormattedName&quot; /&gt;
			 *           &lt;PropertyValue Property=&quot;title&quot; Path=&quot;Title&quot; /&gt;
			 *           &lt;PropertyValue Property=&quot;org&quot; Path=&quot;CompanyName&quot; /&gt;
			 *           &lt;PropertyValue Property=&quot;role&quot; Path=&quot;OrganizationRole&quot; /&gt;
			 *           &lt;PropertyValue Property=&quot;photo&quot; Path=&quot;Photo&quot; /&gt;
			 *           &lt;PropertyValue Property=&quot;tel&quot;&gt;
			 *             &lt;Collection&gt;
			 *               &lt;Record&gt;
			 *                 &lt;PropertyValue Property=&quot;type&quot;
			 *                   EnumMember=&quot;com.sap.vocabularies.Communication.v1.PhoneType/fax&quot; /&gt;
			 *                 &lt;PropertyValue Property=&quot;uri&quot; Path=&quot;FaxNumber&quot; /&gt;
			 *               &lt;/Record&gt;
			 *               &lt;Record&gt;
			 *                 &lt;PropertyValue Property=&quot;type&quot;
			 *                   EnumMember=&quot;com.sap.vocabularies.Communication.v1.PhoneType/work /&gt;
			 *                 &lt;PropertyValue Property=&quot;uri&quot; Path=&quot;PhoneNumber&quot; /&gt;
			 *               &lt;/Record&gt;
			 *               &lt;Record&gt;
			 *                 &lt;PropertyValue Property=&quot;type&quot;
			 *                   EnumMember=&quot;com.sap.vocabularies.Communication.v1.PhoneType/cell&quot; /&gt;
			 *                 &lt;PropertyValue Property=&quot;uri&quot; Path=&quot;MobileNumber&quot; /&gt;
			 *               &lt;/Record&gt;
			 *             &lt;/Collection&gt;
			 *           &lt;/PropertyValue&gt;
			 *           &lt;PropertyValue Property=&quot;email&quot;&gt;
			 *             &lt;Collection&gt;
			 *               &lt;Record&gt;
			 *                 &lt;PropertyValue Property=&quot;type&quot;
			 *                   EnumMember=&quot;com.sap.vocabularies.Communication.v1.ContactInformationType/work&quot; /&gt;
			 *                 &lt;PropertyValue Property=&quot;address&quot; Path=&quot;EmailAddress&quot; /&gt;
			 *               &lt;/Record&gt;
			 *             &lt;/Collection&gt;
			 *           &lt;/PropertyValue&gt;
			 *         &lt;/Record&gt;
			 *      &lt;/Annotation&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 *
			 * The <code>SmartLink</code> control interprets the <code>com.sap.vocabularies.UI.v1.Hidden</code> annotation. Fields which are
			 * annotated as <code>Bool: "true"</code> are not shown in the contact information but the corresponding data is requested by the backend.
			 *
			 * <i>XML Example of OData V4 with com.sap.vocabularies.UI.v1.Hidden Title Property</i>
			 * <pre>
			 * 	&lt;Annotations Target=&quot;EPM_DEVELOPER_SCENARIO_SRV.Supplier/Title&quot; xmlns=&quot;http://docs.oasis-open.org/odata/ns/edm&quot;&gt;
			 * 		&lt;Annotation Term=&quot;com.sap.vocabularies.UI.v1.Hidden&quot;/&gt;
			 * 	&lt;/Annotations&gt;
			 * </pre>
			 */
			contact: {
				namespace: "com.sap.vocabularies.Communication.v1",
				annotation: "Contact",
				target: [
					"EntityType"
				],
				allowList: {
					values: [
						"Hidden"
					]
				},
				defaultValue: null,
				appliesTo: [
					"text", "label", "value"
				],
				group: [
					"Behavior"
				],
				since: "1.40.1"
			},
			/**
			 * List of actions of the related semantic object that are not shown in the navigation popover.
			 * <i>XML Example of OData with SemanticObjectUnavailableActions on Product/CustomerId</i>
			 *
			 * <pre>
			 *  &lt;Annotations Target=&quot;ProductCollection.Product/CustomerId&quot; xmlns=&quot;http://docs.oasis-open.org/odata/ns/edm&quot;&gt;
			 * 		&lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.SemanticObject&quot; String=&quot;CustomerSO&quot; /&gt;
			 * 		&lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.SemanticObjectUnavailableActions&quot;&gt;
			 * 			&lt;Collection&gt;
			 * 					&lt;String&gt;DeleteCustomer&lt;String/&gt;
			 * 			&lt;/Collection&gt;
			 * 		&lt;/Annotation&gt;
			 * 	&lt;/Annotations&gt;
			 * </pre>
			 */
			semanticObjectUnavailableActions: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "SemanticObjectUnavailableActions",
				target: [
					"Property"
				],
				defaultValue: null,
				appliesTo: [
					"text"
				],
				group: [
					"Behavior"
				],
				since: "1.60.0"
			}
		},

		properties: {
			semanticObject: {
				ignore: true
			},
			additionalSemanticObjects: {
				ignore: true
			},
			semanticObjectController: {
				ignore: true
			},
			fieldName: {
				ignore: true
			},
			// deprecated as of version 1.40.0
			semanticObjectLabel: {
				ignore: true
			},
			createControlCallback: {
				ignore: true
			},
			// changed to <code>false</code> as of version 1.95.0
			mapFieldToSemanticObject: {
				ignore: false
			},
			// changed to <code>false</code> as of version 1.48.0
			contactAnnotationPath: {
				ignore: false
			},
			ignoreLinkRendering: {
				ignore: true
			},
			enableAvailableActionsPersonalization: {
				ignore: false
			},
			uom: {
				ignore: true
			},
			// changed to <code>false</code> as of version 1.48.0
			enabled: {
				ignore: false
			},
			// added with version 1.58.0
			forceLinkRendering: {
				ignore: true
			},
			// added with version 1.75
			beforeNavigationCallback: {
				ignore: true
			},
			text: {
				ignore: true
			},
			wrapping: {
				ignore: true
			},
			// added with version 1.126
			navigationTargetsObtainedCallback: {
				ignore: true
			}
		},

		customData: {}
	};
});
