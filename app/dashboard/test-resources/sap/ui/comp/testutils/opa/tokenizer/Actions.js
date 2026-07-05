
sap.ui.define([
    "sap/ui/test/actions/Press",
    "sap/ui/test/OpaBuilder"
], function (Press, OpaBuilder) {
	"use strict";

	return {
        /**
         * Removes a token with text equal to <code>sTokenText</code> from the <code>ValueHelpDialog</code> tokenizer
         * @param {string} sTokenText Token text
         */
        iRemoveTokenByTextFromValueHelpDialog: function(sTokenText){
            this.waitFor(
                new OpaBuilder()
                    .hasType("sap.ui.comp.valuehelpdialog.ValueHelpDialog")
                    .isDialogElement(true)
                    .do(function(oValueHelpDialog){
                        var oTokenizer = oValueHelpDialog._getTokenizer();
                        if (oTokenizer) {
                            var aTokens = oTokenizer.getTokens();
                            var nIndex = -1;
                            for (var i = 0; i < aTokens.length; i++) {
                                if (aTokens[i].getText() === sTokenText){
                                    nIndex = i;
                                    break;
                                }
                            }
                            if (nIndex > -1){
                                var oIcon = aTokens[nIndex].getAggregation("deleteIcon");
                                return new Press().executeOn(oIcon);
                            }
                        }
                    })
                    .build()
            );
        },
        /**
         * Removes a token positioned at index <code>nIndex</code> from the <code>ValueHelpDialog</code> tokenizer
         * @param {number} nIndex The position of the token in the tokenizer
         */
        iRemoveTokenByIndexFromValueHelpDialog: function(nIndex){
            this.waitFor(
                new OpaBuilder()
                    .hasType("sap.ui.comp.valuehelpdialog.ValueHelpDialog")
                    .isDialogElement(true)
                    .do(function(oValueHelpDialog){
                        var oTokenizer = oValueHelpDialog._getTokenizer();
                        if (oTokenizer) {
                            var aTokens = oTokenizer.getTokens();
                            if ( aTokens.length > nIndex ){
                                var oIcon = aTokens[nIndex].getAggregation("deleteIcon");
                                return new Press().executeOn(oIcon);
                            }
                        }
                    })
                    .build()
            );
        },
        /**
         * Removes all tokens from the tokenizer of the currently opened <code>ValueHelpDialog</code>
         */
        iRemoveAllTokensFromValueHelpDialog: function(){
            this.waitFor(
                new OpaBuilder()
                    .hasType("sap.ui.comp.valuehelpdialog.ValueHelpDialog")
                    .isDialogElement(true)
                    .do(function(oValueHelpDialog){
                        var oButtonRemoveAll = oValueHelpDialog._oRemoveAllSelectedItemsBtn;
                        if (oButtonRemoveAll) {
                            return new Press().executeOn(oButtonRemoveAll);
                        }
                    })
                    .build()
            );
        }
    };
});