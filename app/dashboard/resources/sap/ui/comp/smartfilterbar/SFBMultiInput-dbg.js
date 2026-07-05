/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides sap.ui.comp.smartfilterbar.SFBMultiInput
sap.ui.define([
	"sap/m/MultiInput",
	"sap/m/MultiInputRenderer",
	'sap/base/strings/whitespaceReplacer',
	'sap/ui/comp/smartfilterbar/SFBTokenizer',
	'sap/m/library'
	],
function (
	MultiInput,
	MultiInputRenderer,
	whitespaceReplacer,
	SFBTokenizer,
	mLibrary
) {
	"use strict";

	var TokenizerRenderMode = mLibrary.TokenizerRenderMode;

	/**
	 * Constructor for a new <code>SFBMultiInput</code>.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class
	 * Private control used by the <code>SmartFilterBar</code> control.
	 *
	 * @extends sap.m.MultiInput
	 *
	 * @author SAP SE
	 * @version 1.136.0
	 *
	 * @constructor
	 * @private
	 * @since 1.73
	 * @alias sap.ui.comp.smartfilterbar.SFBMultiInput
	 */
	var SFBMultiInput = MultiInput.extend("sap.ui.comp.smartfilterbar.SFBMultiInput", {
		metadata: {
			library: "sap.ui.comp",
			aggregations: {
				/**
				 * The tokenizer which displays the tokens
				 */
				tokenizer: {type: "sap.ui.comp.smartfilterbar.SFBTokenizer", multiple: false, visibility: "hidden"}
			}
		},
		renderer: MultiInputRenderer
	});

	SFBMultiInput.prototype._initTokenizer = function () {
		return new SFBTokenizer({
			renderMode: TokenizerRenderMode.Narrow,
			tokenDelete: MultiInput.prototype._tokenDelete.bind(this)
		});
	};
	SFBMultiInput.prototype.setTokens = function (aTokens) {
		aTokens.map(function (oToken) {
			oToken.getTextForCopy = this._getTextForCopy.bind(this, oToken);
			return oToken.setText(whitespaceReplacer(oToken.getText()));
		}.bind(this));
		MultiInput.prototype.setTokens.apply(this, arguments);
		this._pendingAutoTokenGeneration = true;
		this._getFilterProvider()._tokenUpdate({
			control: this,
			fieldViewMetadata: this._getFieldViewMetadata()
		});
		this._pendingAutoTokenGeneration = false;
		this._isOninputTriggered = false;
	};

	SFBMultiInput.prototype._setFilterProvider = function (oFilterProvider) {
		this.oFilterProvider = oFilterProvider;
	};

	SFBMultiInput.prototype._getFilterProvider = function () {
		return this.oFilterProvider;
	};

	SFBMultiInput.prototype._setFieldViewMetadata = function (oFieldViewMetadata) {
		this.oFieldViewMetadata = oFieldViewMetadata;
	};

	SFBMultiInput.prototype._getFieldViewMetadata = function () {
		return this.oFieldViewMetadata;
	};

	SFBMultiInput.prototype.oninput = function () {
		MultiInput.prototype.oninput.apply(this, arguments);

		this._isOninputTriggered = true;
	};

	SFBMultiInput.prototype.addToken = function () {
		MultiInput.prototype.addToken.apply(this, arguments);

		this._isOninputTriggered = false;
		return this;
	};

	SFBMultiInput.prototype.insertToken = function () {
		MultiInput.prototype.insertToken.apply(this, arguments);

		this._isOninputTriggered = false;
		return this;
	};

	SFBMultiInput.prototype.onBeforeRendering = function () {
		MultiInput.prototype.onBeforeRendering.apply(this, arguments);

		// Try to create a token from a possible (IN) parameter coming from the binding
		// In this phase the value is coming from the binding of the control.
		// BCP: 2180341533 We check if oninput is triggered as input controls now invalidate on keystroke
		if (!this._isOninputTriggered && this.getValue()) {
			this._pendingAutoTokenGeneration = true;
			this._validateCurrentText(true);
			this._pendingAutoTokenGeneration = false;
		}
	};

	SFBMultiInput.prototype._getTextForCopy = function (oToken) {
		var fnSplitMulti = function(sTokenText, aTokensForReplace){
				var tempChar = aTokensForReplace[0];
				for (var i = 1; i < aTokensForReplace.length; i++){
					sTokenText = sTokenText.split(aTokensForReplace[i]).join(tempChar);
				}
				sTokenText = sTokenText.split(tempChar);
				return sTokenText;
			},
			sColumnSeparator = "\t",
			sTokenText = oToken.getText(),
			oValueList,
			sDisplayBehavior,
			sTokenDisplayBehavior = '',
			aResult = [],
			sResult = '',
			iKey,
			oCondition;

		for (iKey in this._getFilterProvider()._aValueListProvider) {
			if (this._getFilterProvider()._aValueListProvider[iKey].sFieldName === this.oFieldViewMetadata.name) {
				oValueList = this._getFilterProvider()._aValueListProvider[iKey];
				sTokenDisplayBehavior = oValueList.sTokenDisplayBehaviour;
			}
		}

		sDisplayBehavior = sTokenDisplayBehavior ? sTokenDisplayBehavior : "";
		oCondition = this._getCondition(sTokenText);
		sResult = sTokenText;

		if (sDisplayBehavior && !oCondition) {
			aResult = fnSplitMulti(sTokenText, ["(", ")"]);
			if (sDisplayBehavior === "descriptionAndId") {
				sResult = [aResult[1], aResult[0]].join(sColumnSeparator);
			} else if (sDisplayBehavior === "idAndDescription") {
				sResult = [aResult[0], aResult[1]].join(sColumnSeparator);
			} else if (sDisplayBehavior === "descriptionOnly") {
				sResult = [oToken.getKey(), oToken.getText()].join(sColumnSeparator);
			} else {
				sResult = sTokenText;
			}
		}
		return sResult;
	};

	SFBMultiInput.prototype._getCondition = function (sCondition) {
		return this._getFilterProvider()._mTokenHandler && this._getFilterProvider()._mTokenHandler[this.getId()]?.parser?._onValidate(sCondition)?.data();
	};


	return SFBMultiInput;

});
