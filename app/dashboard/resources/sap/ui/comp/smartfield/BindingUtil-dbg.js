/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

/**
 * Utility to access control binding for <code>SmartField</code> control.
 *
 * @name sap.ui.comp.smartfield.BindingUtil
 * @author SAP SE
 * @version 1.136.0
 * @private
 * @since 1.28.0
 * @returns {sap.ui.comp.smartfield.BindingUtil} The binding access class.
 */
sap.ui.define(["sap/ui/model/odata/AnnotationHelper", "sap/ui/base/BindingParser"], function( AnnotationHelper, BindingParser ) {
	"use strict";

	/**
	 * @private
	 * @constructor
	 */
	var BindingUtil = function() {
		//nothing to do here.
	};

	/**
	 * Corrects a given navigation path, especially IDs are removed, e.g. <code>Tasks('id-1428419016778-51')</code> is converted into
	 * <code>Tasks</code>.
	 *
	 * @param {string} sPath The path to be converted.
	 * @returns {string} Conversion result.
	 * @since 1.29.0
	 * @protected
	 */
	BindingUtil.prototype.correctPath = function(sPath) {
		var sEntity,
			oRegExp = /\((.+)\)*/,
			aMatches = oRegExp.exec(sPath);

		if (aMatches) {
			sEntity = sPath.replace(aMatches[0], "");
		} else {
			sEntity = sPath || "";
		}

		return sEntity.replace("/", "");
	};

	/**
	 * Calculates the navigation properties to traverse. The binding context and object binding are used as a basis for this calculation.
	 *
	 * @param {sap.ui.core.control} oControl The control for which the binding context and object binding have to be analyzed.
	 * @returns {object} The navigation properties to traverse or an empty array, never <code>null</code>.
	 * @since 1.29.0
	 * @protected
	 */
	BindingUtil.prototype.getNavigationProperties = function(oControl) {
		var oObjectBinding, oBindingContext, mResult = {};

		// check the binding context.
		oBindingContext = oControl.getBindingContext();

		if (oBindingContext && oBindingContext.sPath) {
			mResult.paths = oBindingContext.sPath.split("/");
		}

		// check the object binding.
		oObjectBinding = oControl.getObjectBinding();

		if (oObjectBinding && oObjectBinding.sPath) {
			mResult.objectBinding = oObjectBinding.sPath;

			if (mResult.paths) {
				mResult.paths.push(oObjectBinding.sPath);
			} else {
				mResult.paths = [
					oObjectBinding.sPath
				];
			}
		}

		if (!mResult.paths) {
			mResult.paths = [];
		}

		return mResult;
	};

	/**
	 * Converts the paths from the binding information of a control property to their original form.
	 *
	 * @param {object} oBindingInfo The binding information from the control
	 * @param {array} aPaths The binding paths
	 * @param {object} oInfo Information about the binding
	 * @protected
	 */
	BindingUtil.prototype.getBindingParts = function(oBindingInfo, aPaths, oInfo) {
		var len = 0, i, oPart, sOut;

		if (oBindingInfo && oBindingInfo.parts) {
			len = oBindingInfo.parts.length;
		}

		for (i = 0; i < len; i++) {
			sOut = "";
			oPart = oBindingInfo.parts[i];

			if (oPart.model) {
				sOut = sOut + oPart.model + ">";
			}

			sOut = sOut + oPart.path;
			aPaths.push(sOut);
			oInfo.length++;
		}
	};

	/**
	 * Converts binding information for a control property to its original form.
	 *
	 * @param {object} oInfo The binding information from the control.
	 * @returns {object} Conversion result.
	 * @protected
	 */
	BindingUtil.prototype.toBinding = function(oInfo) {
		var oOut = {}, n, oPart, i, len, mNames = {
			model: true,
			formatter: true,
			mode: true,
			path: true
		};

		if (oInfo) {
			if (oInfo.parts && oInfo.parts.length) {
				len = oInfo.parts.length;
				oOut.parts = [];
			}

			for (i = 0; i < len; i++) {
				oPart = oInfo.parts[i];
				oOut.parts.push(oPart);
			}

			for (n in mNames) {
				if (oInfo[n]) {
					oOut[n] = oInfo[n];
				}
			}

			return oOut;
		}

		return null;
	};

	/**
	 * Converts binding information for a control property to its original form.
	 *
	 * @param {object} oInfo The binding information from the control.
	 * @returns {string} Conversion result.
	 * @protected
	 */
	BindingUtil.prototype.toBindingPath = function(oInfo) {
		var oOut, sOut = "", oPart, i, len;

		oOut = this.toBinding(oInfo);

		if (oOut) {
			if (oOut.model) {
				sOut = oOut.model + ">";
			}

			if (oOut.path) {
				sOut = sOut + oOut.path;
			} else if (oOut.parts && oOut.parts.length > 0) {
				len = oOut.parts.length;

				for (i = 0; i < len; i++) {
					oPart = oOut.parts[i];

					if (oPart.model) {
						sOut = sOut + oPart.model + ">";
					}

					sOut = sOut + oPart.path;
				}
			}
		}

		return sOut;
	};

	/**
	 * Creates a binding definition for a formatter.
	 *
	 * @param {string} sModel The name of the current model
	 * @param {object} oFormatter The formatter
	 * @param {array} aPaths Overall collection of paths
	 * @returns {object} The binding definition
	 * @protected
	 */
	BindingUtil.prototype.fromFormatter = function(sModel, oFormatter, aPaths) {
		var i, len, aParts, mBind = {
			model: sModel,
			formatter: oFormatter.formatter
		};

		aParts = oFormatter.path();
		len = aParts.length;

		if (len > 0) {
			mBind.parts = aParts;

			if (aPaths) {
				for (i = 0; i < len; i++) {
					aPaths.push(aParts[i]);
				}
			}

		} else {
			mBind.path = "";
		}

		return mBind;
	};

	/**
	 * This helper function is able to to handle odata binding expressions like path and apply function
	 *
	 * @param {object} oBindingExpression The oData description starting with <code>Apply Function</code> or with a <code>path</code> expression
	 * @param {object} oBindingContext The current binding context
	 * @returns {string} The resulting value of the function execution
	 * @private
	 * @since 1.30.0
	 */
	BindingUtil.prototype.executeODataBindingExpression = function(oBindingExpression, oBindingContext) {

		var i, sValue, aValues, oParseResult, sHref, sHrefResult = "";

		if (oBindingExpression && oBindingContext) {

			sHref = AnnotationHelper.format(oBindingContext, oBindingExpression); // generate a sapui5 binding expression
			sHrefResult = sHref;

			oParseResult = BindingParser.complexParser(sHref, oBindingContext); // parse the binding expression
			aValues = [];
			if (oParseResult) {

				if (oParseResult.formatter) {

					for (i = 0; i < oParseResult.parts.length; i++) {
						sValue = oBindingContext.getProperty(oParseResult.parts[i].path, "value");
						aValues.push(sValue);
					}

					sHrefResult = oParseResult.formatter.apply(null, aValues);
				} else {
					sHrefResult = oBindingContext.getProperty(oParseResult.path, "value");
				}
			}
		}

		return sHrefResult;
	};

	/**
	 * Frees all resources claimed during the life-time of this instance.
	 *
	 * @protected
	 */
	BindingUtil.prototype.destroy = function() {
		//nothing to do here.
	};

	return BindingUtil;
}, true);
