sap.ui.define([
	"sap/ui/test/Opa5",
	"sap/ui/test/OpaBuilder"
], function (Opa5, OpaBuilder) {
	"use strict";

	return {
		/**
		 * Checks that the number of tokens is equal to <code>nCount</code>
		 * @param {number} nCount The number to check against
		 */
		iCheckTokensCountInValueHelpDialogEqualsTo: function(nCount){
			this.waitFor(
				new OpaBuilder()
					.hasType("sap.ui.comp.valuehelpdialog.ValueHelpDialog")
					.isDialogElement(true)
					.do(function(oValueHelpDialog){
						var oTokenizer = oValueHelpDialog._getTokenizer();
						if (oTokenizer) {
							var aTokens = oTokenizer.getTokens();
							Opa5.assert.strictEqual(aTokens.length, nCount, "Number of tokens should be " + nCount);
						}
					})
					.build()
			);
		},
		/**
		 * Checks that the currently opened <code>ValueHelpDialog</code> contains token with text <code>sTokenText</code> in its tokenizer
		 * @param {string} sTokenText The token text
		 */
		iCheckTokenizerInValueHelpDialogContainsToken: function(sTokenText){
			this.waitFor(
				new OpaBuilder()
					.hasType("sap.ui.comp.valuehelpdialog.ValueHelpDialog")
					.isDialogElement(true)
					.do(function(oValueHelpDialog){
						var oTokenizer = oValueHelpDialog._getTokenizer();
						if (oTokenizer) {
							var aFoundTokens = oTokenizer.getTokens().filter(function(t){
								return t.getText() === sTokenText;
							});
							Opa5.assert.ok( aFoundTokens.length > 0, "Should contain token with text '" + sTokenText + "'");
						}
					})
					.build()
			);
		},
		/**
		 * Checks that the currently opened <code>ValueHelpDialog</code> contains all token texts from the list
		 * @param {array} aTokens A list of token texts
		 */
		iCheckTokenizerInValueHelpDialogContainsTokens: function(aTokens){
			function filterTokens(sourceArray, targetItem){
				return sourceArray.filter(function(item){ return item.getText() === targetItem; });
			}
			this.waitFor(
				new OpaBuilder()
					.hasType("sap.ui.comp.valuehelpdialog.ValueHelpDialog")
					.isDialogElement(true)
					.do(function(oValueHelpDialog){
						var oTokenizer = oValueHelpDialog._getTokenizer();
						if (oTokenizer) {
							var aTokenizerTokens = oTokenizer.getTokens();
							var bIsOk = true;
							for (var i = 0; i < aTokens.length; i++) {
								var foundMatches = filterTokens(aTokenizerTokens, aTokens[i]);
								if (foundMatches.length === 0 ){
									bIsOk = false;
									break;
								}
							}
							Opa5.assert.ok( bIsOk, "Should contain all tokens" );
						}
					})
					.build()
			);
		}
	};
});