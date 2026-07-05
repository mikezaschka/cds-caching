/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides control sap.ui.comp.variants.EditableVariantItem.
sap.ui.define(['sap/m/ColumnListItem'], function(ColumnListItem) {
	"use strict";

	/**
	 * Constructor for a new variants/EditableVariantItem.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * @class The EditableVariantItem class describes an editable variant list item for the Manage Variants popup.
	 * @deprecated  As of version 1.120.0, the concept has been discarded.
	 * @extends sap.m.ColumnListItem
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.variants.EditableVariantItem
	 */
	var EditableVariantItem = ColumnListItem.extend("sap.ui.comp.variants.EditableVariantItem", /** @lends sap.ui.comp.variants.EditableVariantItem.prototype */
	{
		metadata: {

			library: "sap.ui.comp",
			properties: {

				/**
				 * Key of the List Item
				 *
				 * @since 1.22.0
				 */
				key: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Indicator if a variant is visible for all users.
				 *
				 * @since 1.26.0
				 */
				global: {
					type: "boolean",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * ABAP Package the variant is assigned. Used for transport functionality
				 *
				 * @since 1.26.0
				 */
				lifecyclePackage: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Identifier of the transport object the variant is assigned to.
				 *
				 * @since 1.26.0
				 */
				lifecycleTransportId: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Variant namespace
				 *
				 * @since 1.26.0
				 */
				namespace: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Indication if variant can be changed
				 *
				 * @since 1.26.0
				 */
				readOnly: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Flags for a variant to indicate why it might be read-only
				 *
				 * @since 1.26.0
				 * @deprecated Since version 1.28.0. Replaced by property <code>labelReadOnly</code>
				 */
				accessOptions: {
					type: "string",
					group: "Misc",
					defaultValue: null,
					deprecated: true
				},

				/**
				 * Indicates if the variant label can be changed
				 *
				 * @since 1.28.0
				 */
				labelReadOnly: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Author of the variant
				 *
				 * @since 1.38.0
				 */
				author: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Indicates if favorites can be created.
				 *
				 * @since 1.50.0
				 */
				favorite: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Assigned contexts.
				 * @since 1.88
				 */
				_contexts: {
					type: "object",
					group: "Misc",
					visibility: "hidden",
					defaultValue: {}
				}
			}
		},
		renderer: {
			apiVersion: 2
		}
	});

	EditableVariantItem.prototype.setContexts = function(mContexts) {
		this.setProperty("_contexts", mContexts);
	};
	EditableVariantItem.prototype.getContexts = function() {
		return this.getProperty("_contexts");
	};


	return EditableVariantItem;

});