/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides sap.ui.comp.smartfilterbar.SFBTokenizer
sap.ui.define([
		"sap/m/Tokenizer",
		"sap/m/TokenizerRenderer"
	],
	function (
		Tokenizer,
		TokenizerRenderer
	) {
		"use strict";

		/**
		 * Constructor for a new <code>SFBTokenizer</code>.
		 *
		 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
		 * @param {object} [mSettings] Initial settings for the new control
		 *
		 * @class
		 * Private control used by the <code>SmartFilterBar</code> control.
		 *
		 * @extends sap.m.Tokenizer
		 *
		 * @author SAP SE
		 * @version 1.136.0
		 *
		 * @constructor
		 * @private
		 * @since 1.123
		 * @alias sap.ui.comp.smartfilterbar.SFBTokenizer
		 */
		var SFBTokenizer = Tokenizer.extend("sap.ui.comp.smartfilterbar.SFBTokenizer", {
			metadata: {
				library: "sap.ui.comp"
			},
			renderer: TokenizerRenderer
		});

		/**
		 * Handles the copy event.
		 *
		 * @private
		 */
		SFBTokenizer.prototype._copy = function() {
			this._fillClipboard("copy");
		};

		SFBTokenizer.prototype._fillClipboard = function (sShortcutName) {
			var aSelectedTokens = this.getSelectedTokens();
			var bSpecial = false;
			var sTokensTexts = aSelectedTokens.map(function(oToken) {
				if (!bSpecial && oToken.getTextForCopy) {
					bSpecial = true;
				}
				return oToken.getTextForCopy ? oToken.getTextForCopy() : oToken.getText();
			}).join("\r\n");

			var sTokensTextsHTML = "<table><tr>" + aSelectedTokens.map(function(oToken) {
				// we copy it as it is in the token
				return "<td>" + oToken.getText() + "</td>";
			}).join("</tr><tr>") + "</tr></table>";

			/* fill clipboard with tokens' texts so parent can handle creation */
			var cutToClipboard = function(oEvent) {
				if (oEvent.clipboardData) {
					oEvent.clipboardData.setData('text/plain', sTokensTexts);
					if (bSpecial) {
						oEvent.clipboardData.setData('text/html', sTokensTextsHTML);
					}
				} else {
					oEvent.originalEvent.clipboardData.setData('text/plain', sTokensTexts);
					if (bSpecial) {
						oEvent.originalEvent.clipboardData.setData('text/html', sTokensTextsHTML);
					}
				}

				oEvent.preventDefault();
			};

			document.addEventListener(sShortcutName, cutToClipboard);
			document.execCommand(sShortcutName);
			document.removeEventListener(sShortcutName, cutToClipboard);

		};

		return SFBTokenizer;

	});
