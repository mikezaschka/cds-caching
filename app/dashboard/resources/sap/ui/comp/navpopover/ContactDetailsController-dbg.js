/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	'sap/ui/comp/library',
	'sap/ui/core/Element',
	"sap/ui/core/Lib",
	'sap/ui/layout/form/SimpleForm',
	'sap/m/Title',
	'sap/m/Label',
	'sap/m/Text',
	'sap/m/Image',
	'sap/m/Link',
	'sap/ui/base/ManagedObjectObserver',
	'sap/ui/comp/odata/MetadataAnalyser',
	'sap/base/Log',
	"sap/ui/layout/library",
	"sap/ui/core/library",
	"sap/base/util/merge"
], function(
	CompLibrary,
	Element,
	Library,
	SimpleForm,
	Title,
	Label,
	Text,
	Image,
	Link,
	ManagedObjectObserver,
	MetadataAnalyser,
	Log,
	layoutLibrary,
	coreLibrary,
	merge
) {
	"use strict";

	// shortcut for sap.ui.core.TitleLevel
	var TitleLevel = coreLibrary.TitleLevel;

	// shortcut for sap.ui.layout.form.SimpleFormLayout
	var SimpleFormLayout = layoutLibrary.form.SimpleFormLayout;

	/**
	 * Constructor for a new navpopover/ContactDetailsController.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * @class The ContactDetailsController ...
	 * @extends sap.ui.core.Element
	 * @constructor
	 * @private
	 * @since 1.52
	 * @alias sap.ui.comp.navpopover.ContactDetailsController
	 */
	var ContactDetailsController = Element.extend("sap.ui.comp.navpopover.ContactDetailsController", /** @lends sap.ui.comp.navpopover.ContactDetailsController.prototype */
	{
		metadata: {
			library: "sap.ui.comp"
		}
	});

	ContactDetailsController.prototype.init = function() {
		this._oObserver = null;
	};

	ContactDetailsController.prototype.exit = function() {
		if (this._oObserver) {
			this._oObserver.disconnect();
			this._oObserver = null;
		}
	};

	/**
	 * Depending on the <code>sContactAnnotationPath</code> the binding path will be determined.
	 *
	 * @param {string} sBindingPath Binding path of binding context (e.g. "/ProductCollection('38094020.0')")
	 * @param {string} sContactAnnotationPath NavigationProperty (e.g. 'to_Supplier') or
	 * foreign simple EntitySet (e.g. 'SupplierCollection') containing communication contact annotation. Empty
	 * string means that communication contact annotation of the current EntitySet (bind via sBindingPath) should be used.
	 * @param {string} sKey Key value for the case that sContactAnnotationPath is a foreign EntitySet
	 * @returns {Promise} A <code>Promise</code> for asynchronous execution returning the new binding path of contact annotation
	 * @protected
	 */
	ContactDetailsController.prototype.getBindingPath4ContactAnnotation = function(sBindingPath, sContactAnnotationPath, sKey) {
		if (sContactAnnotationPath === undefined || sContactAnnotationPath === null || !sBindingPath) {
			return Promise.resolve(null);
		}
		if (!this.getModel()) {
			return Promise.resolve(null);
		}
		// ODataModel returns MetaModel, JSONModel returns undefined
		if (!this.getModel().getMetaModel()) {
			return Promise.resolve(null);
		}

		var oMetaModel = this.getModel().getMetaModel();

		return oMetaModel.loaded().then(function() {
			var sPath;
			try {
				oMetaModel.getMetaContext(sBindingPath);
			} catch (oError) {
				Log.error("sap.ui.comp.navpopover.ContactDetailsController.getBindingPath4ContactAnnotation: binding path '" + sBindingPath + "' is not valid. Error has been caught: " + oError);
				return null;
			}
			// Check if 'sContactAnnotationPath' is an entitySet
			try {
				sPath = "/" + sContactAnnotationPath + "('" + sKey + "')";
				oMetaModel.getMetaContext(sPath);
				// 'sContactAnnotationPath' is an entitySet
				return sPath;
			} catch (oError) {
				// 'sContactAnnotationPath' is a NavigationProperty. Go ahead.
			}
			// 'sContactAnnotationPath' is a navigationProperty or an empty string (meaning the contact annotation of current entityset should be used)
			try {
				sPath = sContactAnnotationPath ? sBindingPath + "/" + sContactAnnotationPath : sBindingPath;
				oMetaModel.getMetaContext(sPath);
				return sPath;
			} catch (oError) {
				Log.error("sap.ui.comp.navpopover.ContactDetailsController.getBindingPath4ContactAnnotation: the path of sContactAnnotationPath '" + sBindingPath + "/" + sContactAnnotationPath + "' is not valid. Error has been caught: " + oError);
				return null;
			}
		});
	};

	ContactDetailsController.prototype.getContactDetailsAnnotation = function(sBindingPathOfAnnotationEntitySet) {
		if (!sBindingPathOfAnnotationEntitySet) {
			return null;
		}
		var oMetadataAnalyer = new MetadataAnalyser(this.getModel());
		var oContactAnnotation = oMetadataAnalyer.getContactAnnotation(sBindingPathOfAnnotationEntitySet);
		if (!oContactAnnotation) {
			return null;
		}
		return oContactAnnotation;
	};

	/**
	 * This method expects that metamodel has been already loaded (at the latest in getBindingPath4ContactAnnotation)
	 *
	 * @param {string} sBindingPathOfAnnotationEntitySet E.g. "/ProductCollection('38094020.0')/to_Supplier"
	 * @return {SimpleForm[]} Array of SimpleForm controls
	 * @protected
	 */
	ContactDetailsController.prototype.getContactDetailsContainers = function(sBindingPathOfAnnotationEntitySet) {
		var oContactAnnotation = this.getContactDetailsAnnotation(sBindingPathOfAnnotationEntitySet);
		if (!oContactAnnotation) {
			return [];
		}

		var aContent = [];
		var aExpands = [];
		var aSelects = [];
		var oSimpleForm;

		this._oObserver = new ManagedObjectObserver(function(oChanges) {
			if (oChanges.type === "property" && oChanges.name === "visible") {
				var bVisible = false;
				// Title is always visible, start with next element
				for (var iIndex = 1; iIndex < oSimpleForm.getContent().length; iIndex++) {
					if (oSimpleForm.getContent()[iIndex].getLabelFor && oSimpleForm.getContent()[iIndex].getLabelFor()) {
						continue;
					}
					if (oSimpleForm.getContent()[iIndex].getVisible()) {
						bVisible = true;
					}
				}
				oSimpleForm.setVisible(bVisible);
			}
		});

		// Order of shown elements in SimpleForm
		var oRB = Library.getResourceBundleFor("sap.ui.comp");

		// We have to request data also if the property is annotated as UI.Hidden
		this.addProperty2ExpandAndSelect("photo", oContactAnnotation, sBindingPathOfAnnotationEntitySet, aExpands, aSelects);
		this._addPhoto("photo", oContactAnnotation, sBindingPathOfAnnotationEntitySet, aContent, this._oObserver);

		// We have to request data also if the property is annotated as UI.Hidden
		this.addProperty2ExpandAndSelect("fn", oContactAnnotation, sBindingPathOfAnnotationEntitySet, aExpands, aSelects);
		this._addLabeledText("fn", oRB.getText("POPOVER_CONTACT_SECTION_NAME"), oContactAnnotation, sBindingPathOfAnnotationEntitySet, aContent, this._oObserver);

		this.addProperty2ExpandAndSelect("role", oContactAnnotation, sBindingPathOfAnnotationEntitySet, aExpands, aSelects);
		this._addLabeledText("role", oRB.getText("POPOVER_CONTACT_SECTION_ROLE"), oContactAnnotation, sBindingPathOfAnnotationEntitySet, aContent, this._oObserver);

		this.addProperty2ExpandAndSelect("title", oContactAnnotation, sBindingPathOfAnnotationEntitySet, aExpands, aSelects);
		this._addLabeledText("title", oRB.getText("POPOVER_CONTACT_SECTION_JOBTITLE"), oContactAnnotation, sBindingPathOfAnnotationEntitySet, aContent, this._oObserver);

		this.addProperty2ExpandAndSelect("org", oContactAnnotation, sBindingPathOfAnnotationEntitySet, aExpands, aSelects);
		this._addLabeledText("org", oRB.getText("POPOVER_CONTACT_SECTION_DEPARTMENT"), oContactAnnotation, sBindingPathOfAnnotationEntitySet, aContent, this._oObserver);

		this._addEmails(oContactAnnotation, sBindingPathOfAnnotationEntitySet, aExpands, aSelects, aContent, this._oObserver);

		this._addTels(oContactAnnotation, sBindingPathOfAnnotationEntitySet, aExpands, aSelects, aContent, this._oObserver);

		this._addAddresses(oContactAnnotation, sBindingPathOfAnnotationEntitySet, aExpands, aSelects, aContent, this._oObserver);

		if (!aContent.length) {
			return [];
		}
		aContent.splice(0, 0, new Title({
			text: Library.getResourceBundleFor("sap.ui.comp").getText("POPOVER_CONTACT_SECTION_TITLE"),
			level: TitleLevel.H2
		}));

		oSimpleForm = new SimpleForm({
			maxContainerCols: 1,
			editable: false,
			layout: SimpleFormLayout.ResponsiveGridLayout,
			content: aContent
		});
		oSimpleForm.addStyleClass("sapuicompContactDetailsForm");

		this._requestData(oSimpleForm, sBindingPathOfAnnotationEntitySet, aExpands, aSelects);

		return [
			oSimpleForm
		];
	};

	ContactDetailsController.prototype._addPhoto = function(sAnnotationElementName, oContactAnnotation, sBindingPathOfAnnotationEntitySet, aContent, oObserver) {
		if (!oContactAnnotation[sAnnotationElementName]) {
			return;
		}
		var sBindingPathOfProperty = sBindingPathOfAnnotationEntitySet + "/" + oContactAnnotation[sAnnotationElementName].Path;

		// Take over property to the SimpleForm only if the property is not annotated as UI.Hidden
		if (this.isPropertyHidden(sBindingPathOfProperty)) {
			return;
		}

		var oControl = new Image({
			// width: "3rem",
			src: {
				path: sBindingPathOfProperty
			},
			visible: {
				path: sBindingPathOfProperty,
				formatter: function(oValue) {
					return !!oValue;
				}
			},
			decorative: false
		});
		oControl.addStyleClass("sapUiIcon");
		oControl.addStyleClass("navigationPopoverThumbnail");
		oObserver.observe(oControl, {
			properties: [
				"visible"
			]
		});
		aContent.push(oControl);
	};

	/**
	 * Adds label and text to <code>aContent</code> array if corresponding annotation exists.
	 *
	 * When a property is annotated with UI.Hidden, this field shall be technically there on the UI, but not rendered at all.
	 * Means: It can be used as "datasource" e.g. to control the application flow, but not as a "information" for the user.
	 * Note: Regarding NavigationPopover we have to request the data via <code>select</code> but do not show the data on the UI.
	 * @private
	 */
	ContactDetailsController.prototype._addLabeledText = function(sAnnotationElementName, sLabelText, oContactAnnotation, sBindingPathOfAnnotationEntitySet, aContent, oObserver) {
		if (!oContactAnnotation[sAnnotationElementName]) {
			return;
		}
		var sBindingPathOfProperty = sBindingPathOfAnnotationEntitySet + "/" + oContactAnnotation[sAnnotationElementName].Path;

		// Take over property to the SimpleForm only if the property is not annotated as UI.Hidden
		if (this.isPropertyHidden(sBindingPathOfProperty)) {
			return;
		}

		var oControl = new Text({
			text: {
				path: sBindingPathOfProperty
			},
			visible: {
				path: sBindingPathOfProperty,
				formatter: function(oValue) {
					return !!oValue;
				}
			}
		});
		var oLabel = new Label({
			// design: oElement.emphasized ? sap.m.LabelDesign.Bold : sap.m.LabelDesign.Standard,
			text: sLabelText,
			labelFor: oControl.getId()
		});
		oObserver.observe(oControl, {
			properties: [
				"visible"
			]
		});
		aContent.push(oLabel);
		aContent.push(oControl);
	};

	ContactDetailsController.prototype._addEmails = function(oContactAnnotation, sBindingPathOfAnnotationEntitySet, aExpands, aSelects, aContent, oObserver) {
		if (!oContactAnnotation.email || !oContactAnnotation.email.length) {
			return;
		}
		var oRB = Library.getResourceBundleFor("sap.ui.comp");
		var aEmailsCopy = merge([], oContactAnnotation.email);

		// Show email(s) annotated with 'preferred' on top (independent on type e.g. 'work' or 'home' etc) and then non 'preferred' 'work' email(s) below
		aEmailsCopy.filter(function(oEmail) {
			return !oEmail.processed && oEmail.type && (oEmail.type.EnumMember.indexOf("com.sap.vocabularies.Communication.v1.ContactInformationType/preferred") > -1 || oEmail.type.EnumMember.indexOf("com.sap.vocabularies.Communication.v1.ContactInformationType/work") > -1);// && oEmail.type.EnumMember.length === "com.sap.vocabularies.Communication.v1.ContactInformationType/preferred".length;
		}).sort(function(a, b) {
			if (a.type.EnumMember.indexOf("com.sap.vocabularies.Communication.v1.ContactInformationType/preferred") > -1 && b.type.EnumMember.indexOf("com.sap.vocabularies.Communication.v1.ContactInformationType/preferred") < 0) {
				return -1;
			}
			if (b.type.EnumMember.indexOf("com.sap.vocabularies.Communication.v1.ContactInformationType/preferred") > -1 && a.type.EnumMember.indexOf("com.sap.vocabularies.Communication.v1.ContactInformationType/preferred") < 0) {
				return 1;
			}
			return 0;
		}).forEach(function(oEmail) {
			this.addProperty2ExpandAndSelect("address", oEmail, sBindingPathOfAnnotationEntitySet, aExpands, aSelects);
			this._addLabeledEmail("address", oRB.getText("POPOVER_CONTACT_SECTION_EMAIL"), oEmail, sBindingPathOfAnnotationEntitySet, aContent, oObserver);
			oEmail.processed = true;
		}, this);
	};

	/**
	 * The order of different tel types: 'work', 'cell', 'fax'.
	 * Show 'preferred' tel(s) on top when several tels of the same type exist and other below
	 *
	 * @param oContactAnnotation
	 * @param sBindingPathOfAnnotationEntitySet
	 * @param aExpands
	 * @param aSelects
	 * @param aContent
	 * @param oObserver
	 * @private
	 */
	ContactDetailsController.prototype._addTels = function(oContactAnnotation, sBindingPathOfAnnotationEntitySet, aExpands, aSelects, aContent, oObserver) {
		if (!oContactAnnotation.tel || !oContactAnnotation.tel.length) {
			return;
		}
		var oRB = Library.getResourceBundleFor("sap.ui.comp");
		var aTelsCopy = merge([], oContactAnnotation.tel);

		// 1. Show 'preferred work' tel(s) on top and then 'work' tel(s)
		aTelsCopy.filter(function(oTel) {
			return !oTel.processed && oTel.type && oTel.type.EnumMember.indexOf("com.sap.vocabularies.Communication.v1.PhoneType/work") > -1;
		}).sort(function(a, b) {
			if (a.type.EnumMember.indexOf("com.sap.vocabularies.Communication.v1.PhoneType/preferred") > -1) {
				return -1;
			}
			if (b.type.EnumMember.indexOf("com.sap.vocabularies.Communication.v1.PhoneType/preferred") > -1) {
				return 1;
			}
			return 0;
		}).forEach(function(oTel) {
			this.addProperty2ExpandAndSelect("uri", oTel, sBindingPathOfAnnotationEntitySet, aExpands, aSelects);
			this._addLabeledTel("uri", oRB.getText("POPOVER_CONTACT_SECTION_PHONE"), oTel, sBindingPathOfAnnotationEntitySet, aContent, oObserver);
			oTel.processed = true;
		}, this);

		// 2. Show 'preferred cell' tel(s) on top and then 'cell' tel(s)
		aTelsCopy.filter(function(oTel) {
			return !oTel.processed && oTel.type && oTel.type.EnumMember.indexOf("com.sap.vocabularies.Communication.v1.PhoneType/cell") > -1;
		}).sort(function(a, b) {
			if (a.type.EnumMember.indexOf("com.sap.vocabularies.Communication.v1.PhoneType/preferred") > -1) {
				return -1;
			}
			if (b.type.EnumMember.indexOf("com.sap.vocabularies.Communication.v1.PhoneType/preferred") > -1) {
				return 1;
			}
			return 0;
		}).forEach(function(oTel) {
			this.addProperty2ExpandAndSelect("uri", oTel, sBindingPathOfAnnotationEntitySet, aExpands, aSelects);
			this._addLabeledTel("uri", oRB.getText("POPOVER_CONTACT_SECTION_MOBILE"), oTel, sBindingPathOfAnnotationEntitySet, aContent, oObserver);
			oTel.processed = true;
		}, this);

		// 3. Show 'preferred fax' tel(s) on top and then 'fax' tel(s)
		aTelsCopy.filter(function(oTel) {
			return !oTel.processed && oTel.type && oTel.type.EnumMember.indexOf("com.sap.vocabularies.Communication.v1.PhoneType/fax") > -1;
		}).sort(function(a, b) {
			if (a.type.EnumMember.indexOf("com.sap.vocabularies.Communication.v1.PhoneType/preferred") > -1) {
				return -1;
			}
			if (b.type.EnumMember.indexOf("com.sap.vocabularies.Communication.v1.PhoneType/preferred") > -1) {
				return 1;
			}
			return 0;
		}).forEach(function(oTel) {
			this.addProperty2ExpandAndSelect("uri", oTel, sBindingPathOfAnnotationEntitySet, aExpands, aSelects);
			this._addLabeledTel("uri", oRB.getText("POPOVER_CONTACT_SECTION_FAX"), oTel, sBindingPathOfAnnotationEntitySet, aContent, oObserver);
			oTel.processed = true;
		}, this);

		// 4. Show remain 'preferred' tel(s), independent on type e.g. 'home'
		aTelsCopy.filter(function(oTel) {
			return !oTel.processed && oTel.type && oTel.type.EnumMember.indexOf("com.sap.vocabularies.Communication.v1.PhoneType/preferred") > -1;// && oTel.type.EnumMember.length === "com.sap.vocabularies.Communication.v1.PhoneType/preferred".length;
		}).forEach(function(oTel) {
			this.addProperty2ExpandAndSelect("uri", oTel, sBindingPathOfAnnotationEntitySet, aExpands, aSelects);
			this._addLabeledTel("uri", oRB.getText("POPOVER_CONTACT_SECTION_PHONE"), oTel, sBindingPathOfAnnotationEntitySet, aContent, oObserver);
			oTel.processed = true;
		}, this);
	};

	ContactDetailsController.prototype._addAddresses = function(oContactAnnotation, sBindingPathOfAnnotationEntitySet, aExpands, aSelects, aContent, oObserver) {
		if (!oContactAnnotation.adr || !oContactAnnotation.adr.length) {
			return;
		}
		var oRB = Library.getResourceBundleFor("sap.ui.comp");
		var aAddressesCopy = merge([], oContactAnnotation.adr);

		// Show address(es) annotated with 'preferred' on top (independent on type e.g. 'work' or 'home' etc) and then non 'preferred' 'work' address(es) below
		aAddressesCopy.filter(function(oAddress) {
			return !oAddress.processed && oAddress.type && (oAddress.type.EnumMember.indexOf("com.sap.vocabularies.Communication.v1.ContactInformationType/preferred") > -1 || oAddress.type.EnumMember.indexOf("com.sap.vocabularies.Communication.v1.ContactInformationType/work") > -1);// && oAddress.type.EnumMember.length === "com.sap.vocabularies.Communication.v1.ContactInformationType/preferred".length;
		}).sort(function(a, b) {
			if (a.type.EnumMember.indexOf("com.sap.vocabularies.Communication.v1.ContactInformationType/preferred") > -1 && b.type.EnumMember.indexOf("com.sap.vocabularies.Communication.v1.ContactInformationType/preferred") < 0) {
				return -1;
			}
			if (b.type.EnumMember.indexOf("com.sap.vocabularies.Communication.v1.ContactInformationType/preferred") > -1 && a.type.EnumMember.indexOf("com.sap.vocabularies.Communication.v1.ContactInformationType/preferred") < 0) {
				return 1;
			}
			return 0;
		}).forEach(function(oAddress) {
			this._addLabeledAddress(oRB.getText("POPOVER_CONTACT_SECTION_ADR"), oAddress, sBindingPathOfAnnotationEntitySet, aExpands, aSelects, aContent, oObserver);
			oAddress.processed = true;
		}, this);
	};

	ContactDetailsController.prototype._addLabeledAddress = function(sLabelText, oAddress, sBindingPathOfAnnotationEntitySet, aExpands, aSelects, aContent, oObserver) {
		// Defined order: <Street with housenumber>, <Postalcode> <City>, <State>, <Country>
		var aParts = [];
		[
			"street", "code", "locality", "region", "country"
		].forEach(function(sAnnotationElementName) {
			this.addProperty2ExpandAndSelect(sAnnotationElementName, oAddress, sBindingPathOfAnnotationEntitySet, aExpands, aSelects);
			var sBindingPathOfProperty;
			if (oAddress[sAnnotationElementName]) {
				sBindingPathOfProperty = sBindingPathOfAnnotationEntitySet + "/" + oAddress[sAnnotationElementName].Path;
			}
			aParts.push(sBindingPathOfProperty && !this.isPropertyHidden(sBindingPathOfProperty) ? {
				path: sBindingPathOfProperty
			} : {
				path: "$notExisting"
			});
		}, this);

		if (!aParts.length) {
			return;
		}

		var oControl = new Text({
			text: {
				parts: aParts,
				formatter: function(sStreet, sCode, sLocality, sRegion, sCountry) {
					var aValidComponents = [];
					if (sStreet) {
						aValidComponents.push(sStreet);
					}
					if (sCode && sLocality) {
						aValidComponents.push(sCode + " " + sLocality);
					} else {
						if (sCode) {
							aValidComponents.push(sCode);
						}
						if (sLocality) {
							aValidComponents.push(sLocality);
						}
					}
					if (sRegion) {
						aValidComponents.push(sRegion);
					}
					if (sCountry) {
						aValidComponents.push(sCountry);
					}
					return aValidComponents.join(', ');
				}
			},
			visible: {
				parts: aParts,
				formatter: function(sStreet, sCode, sLocality, sRegion, sCountry) {
					return !!(sStreet || sCode || sLocality || sRegion || sCountry);
				}
			}
		});
		var oLabel = new Label({
			// design: oElement.emphasized ? sap.m.LabelDesign.Bold : sap.m.LabelDesign.Standard,
			text: sLabelText,
			labelFor: oControl.getId()
		});
		oObserver.observe(oControl, {
			properties: [
				"visible"
			]
		});
		aContent.push(oLabel);
		aContent.push(oControl);
	};

	ContactDetailsController.prototype._addLabeledTel = function(sAnnotationElementName, sLabelText, oTel, sBindingPathOfAnnotationEntitySet, aContent, oObserver) {
		if (!oTel[sAnnotationElementName] || !sBindingPathOfAnnotationEntitySet) {
			return;
		}
		var sBindingPathOfProperty = sBindingPathOfAnnotationEntitySet + "/" + oTel[sAnnotationElementName].Path;

		// Take over property to the SimpleForm only if the property is not annotated as UI.Hidden
		if (this.isPropertyHidden(sBindingPathOfProperty)) {
			return;
		}

		var oControl = new Link({
			// emphasized: oTel.type.EnumMember.indexOf("com.sap.vocabularies.Communication.v1.ContactInformationType/preferred") > -1,
			href: {
				path: sBindingPathOfProperty,
				formatter: function(oValue) {
					return oValue ? "tel:" + oValue : oValue;
				}
			},
			text: {
				path: sBindingPathOfProperty
			},
			visible: {
				path: sBindingPathOfProperty,
				formatter: function(oValue) {
					return !!oValue;
				}
			}
		});
		var oLabel = new Label({
			// design: oElement.emphasized ? sap.m.LabelDesign.Bold : sap.m.LabelDesign.Standard,
			text: sLabelText,
			labelFor: oControl.getId()
		});
		oObserver.observe(oControl, {
			properties: [
				"visible"
			]
		});
		aContent.push(oLabel);
		aContent.push(oControl);
	};

	ContactDetailsController.prototype._addLabeledEmail = function(sAnnotationElementName, sLabelText, oEmail, sBindingPathOfAnnotationEntitySet, aContent, oObserver) {
		if (!oEmail[sAnnotationElementName] || !sBindingPathOfAnnotationEntitySet) {
			return;
		}
		var sBindingPathOfProperty = sBindingPathOfAnnotationEntitySet + "/" + oEmail[sAnnotationElementName].Path;

		// Take over property to the SimpleForm only if the property is not annotated as UI.Hidden
		if (this.isPropertyHidden(sBindingPathOfProperty)) {
			return;
		}

		var oControl = new Link({
			// emphasized: oEmail.type.EnumMember.indexOf("com.sap.vocabularies.Communication.v1.ContactInformationType/preferred") > -1,
			href: {
				path: sBindingPathOfProperty,
				formatter: function(oValue) {
					return oValue ? "mailto:" + oValue : oValue;
				}
			},
			text: {
				path: sBindingPathOfProperty
			},
			visible: {
				path: sBindingPathOfProperty,
				formatter: function(oValue) {
					return !!oValue;
				}
			}
		});
		var oLabel = new Label({
			// design: oElement.emphasized ? sap.m.LabelDesign.Bold : sap.m.LabelDesign.Standard,
			text: sLabelText,
			labelFor: oControl.getId()
		});
		oObserver.observe(oControl, {
			properties: [
				"visible"
			]
		});
		aContent.push(oLabel);
		aContent.push(oControl);
	};

	/**
	 * Adds path to <code>aExpands</code> and <code>aSelects</code> if not exists already.
	 * @param sAnnotationElementName
	 * @param oAnnotation
	 * @param {string} sBindingPathOfAnnotationEntitySet E.g. "/ProductCollection('38094020.0')/to_Supplier/to_Address/Street"
	 * @param {string[]} aExpands Array of expand paths (E.g. ["to_Supplier/to_Address"])
	 * @param {string[]} aSelects Array of select paths (E.g. ["Street"])
	 * @protected
	 */
	ContactDetailsController.prototype.addProperty2ExpandAndSelect = function(sAnnotationElementName, oAnnotation, sBindingPathOfAnnotationEntitySet, aExpands, aSelects) {
		if (!oAnnotation[sAnnotationElementName] || !sBindingPathOfAnnotationEntitySet) {
			return;
		}
		var sBindingPathOfProperty = sBindingPathOfAnnotationEntitySet + "/" + oAnnotation[sAnnotationElementName].Path;
		if (!sBindingPathOfProperty) {
			return;
		}
		if (sBindingPathOfProperty.indexOf("/") !== 0) {
			throw ("sap.ui.comp.navpopover.ContactDetailsController.addProperty2ExpandAndSelect: the path of sBindingPathOfProperty '" + sBindingPathOfProperty + "' is not valid.");
		}
		var aPathParts = sBindingPathOfProperty.split("/");
		aPathParts.shift(); // remove '/' at the beginning
		aPathParts.shift(); // remove binding path 'ProductCollection('38094020.0')'
		var sSelectPath = aPathParts.join("/");
		if (sSelectPath) {
			aSelects.push(sSelectPath);
		}

		aPathParts.pop(); // remove property
		var sExpandPath = aPathParts.join("/");
		if (!sExpandPath) {
			return;
		}
		var aExpandPath = aExpands.filter(function(sPathExpand) {
			return sPathExpand === sExpandPath;
		});
		if (!aExpandPath.length) {
			aExpands.push(sExpandPath);
		}
	};

	/**
	 * Checks if the property with the path <code>sPropertyPath</code> is annotated with UI.Hidden annotation.
	 * Note: This method expects that the metamodel has already been loaded (at the latest in getBindingPath4ContactAnnotation).
	 *
	 * @param {string} sPropertyPath Absolute property path e.g. "/ProductCollection('38094020.0')/to_Supplier/SupplierId"
	 * @returns {boolean} true if the property is annotated as UI.Hidden and false if property is not annotated as UI.Hidden or if the property does not exist
	 * @protected
	 */
	ContactDetailsController.prototype.isPropertyHidden = function(sPropertyPath) {
		var oMetaContext;
		if (!this.getModel()) {
			Log.error("sap.ui.comp.navpopover.ContactDetailsController.isPropertyHidden: the model does not exist");
			return false;
		}
		// ODataModel returns MetaModel, JSONModel returns undefined
		if (!this.getModel().getMetaModel()) {
			Log.error("sap.ui.comp.navpopover.ContactDetailsController.isPropertyHidden: the model should be the ODataModel");
			return false;
		}

		try {
			oMetaContext = this.getModel().getMetaModel().getMetaContext(sPropertyPath);
		} catch (oError) {
			Log.error("sap.ui.comp.navpopover.ContactDetailsController.isPropertyHidden: the path of property path '" + sPropertyPath + "' is not valid. Error has been caught: " + oError);
			return false;
		}
		var oProperty = oMetaContext.getProperty(oMetaContext.getPath());
		return MetadataAnalyser.isHidden(oProperty);
	};

	ContactDetailsController.prototype._requestData = function(oSimpleForm, sBindingPathOfAnnotationEntitySet, aExpands, aSelects) {
		// Read data only if needed
		var oParameters = {};
		if (aExpands.length) {
			oParameters.expand = aExpands.join(",");
		}
		if (aSelects.length) {
			oParameters.select = aSelects.join(",");
		}
		var sBindingPath = "/" + sBindingPathOfAnnotationEntitySet.split("/")[1];
		oSimpleForm.bindObject({
			path: sBindingPath,
			parameters: oParameters,
			events: {
				change: function() {
					oSimpleForm.invalidate();
				}
			}
		});
	};

	return ContactDetailsController;
});