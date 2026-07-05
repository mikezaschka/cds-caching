/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define(["sap/ui/comp/smartfield/SideEffectUtil"], function(SideEffectUtil) {
	"use strict";

	/**
	 * Utility class that provides useful functionality for Fiori Elements.
	 *
	 * @namespace
	 * @alias sap.ui.comp.util.SharedUtil
	 * @private
	 * @ui5-restricted sap.fe
	 * @since 1.129
	 */
	var SharedUtil = {

		/**
		 * Calculates/gets and applies the field group IDs according to the side effects annotation to a basic control
		 *
		 * @param {sap.ui.core.Control} oControl the control for which the field group id should be generated/returned
		 * @param {object} oMetaData the meta data used to create the control
		 * @param {object} oMetaData.entitySet the OData entity set definition
		 * @param {object} oMetaData.entityType the OData entity type definition
		 * @param {object} oMetaData.property the OData property definition
		 * @param {string} oMetaData.path the binding path
		 * @param {sap.ui.core.mvc.View} oView (optional) the view of the control. If not provided it will we searched accross all the parents of the control for the first found.
		 * @param {sap.ui.model.Context} oContext (optional) context of which the SideEffects will be  added to calculation or taken. If not provided the control's binding context is used.
		 * @returns {array} the IDs of the field groups
		 * @private
		 * @throws {Error} If oControl, oMetadata or oView are not provided, the oControl does not have view or setter for field group ids
		 * @since 1.129
		 */
		applyFieldGroupIDs: function(oControl, oMetadata, oView, oContext) {
			var oSideEffectUtil, oControlConfiguration, oView, aFieldGroupIDs;

			if (!oControl || !oMetadata) {
				throw new Error("Missing control or metadata on applying the field group ids.");
			}

			if (!oControl.setFieldGroupIds) {
				throw new Error("Control does not have setFieldGroupId method.");
			}

			if (!oContext) {
				oControlConfiguration = oControl;
			} else {
				if (!oContext.isA("sap.ui.model.Context")) {
					throw new Error("The provided context is incorrect type.");
				}

				oControlConfiguration = {
					getBindingContext: function() { return oContext; }
				};
			}

			oSideEffectUtil = new SideEffectUtil(oControlConfiguration);

			if (!oView) {
				oView = oControl.getParent();
				while (oView) {
					if (oView.isA("sap.ui.core.mvc.View")) {
						break;
					}

					oView = oView.getParent();
				}

				if (!oView || !oView.isA("sap.ui.core.mvc.View")) {
					throw new Error("Missing control's view on applying the field group ids.");
				}
			}

			aFieldGroupIDs = oSideEffectUtil.getFieldGroupIDs(oMetadata, oView);
			oControl.setFieldGroupIds(aFieldGroupIDs);
			oSideEffectUtil.destroy();

			return aFieldGroupIDs;
		}
	};

	return SharedUtil;
}, /* bExport= */ true);