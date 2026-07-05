/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
    "sap/ui/core/CustomData",
    "sap/ui/fl/changeHandler/condenser/Classification",
    "./Utils",
    "sap/base/util/uid"
], function (CustomData, Classification, Utils, uid) {
	"use strict";

    function findAggregatedElementWithProperty(oModifier, aAggregatedElements, sProperty, sValue) {
        return new Promise(function(resolve, reject) {
            var aPropertyPromises = [];
            for (var i = 0; i < aAggregatedElements.length; i++) {
                aPropertyPromises.push(oModifier.getProperty(aAggregatedElements[i], sProperty));
            }
            Promise.all(aPropertyPromises).then(function (aValues) {
                var aFoundElements = [];
                for (var i = 0; i < aValues.length; i++) {
                    if (aValues[i] == sValue) {
                        aFoundElements.push(aAggregatedElements[i]);
                    }
                }
                resolve(aFoundElements);
            });
        });
    }

    function doApplyChange(oChange, oSmartTable, mPropertyBag, bIsRevert) {
        return new Promise(function(resolve, reject) {
            var oChangeContent = bIsRevert ? oChange.getRevertData() : oChange.getContent();
            var oModifier = mPropertyBag.modifier;

            oModifier.getAggregation(oSmartTable, "customData").then(function(aAggregation) {
                findAggregatedElementWithProperty(oModifier, aAggregation, "key", "p13nData_ToolbarContentMove").then(function(aFoundElements) {

                    var finalizeChange = function(oToolbarMoveSettings) {
                        oModifier.setProperty(oToolbarMoveSettings, "value", oChangeContent);

                        if (bIsRevert) {
                            oChange.resetRevertData();
                        }

                        if (oSmartTable._applyToolbarContentOrder) { // Should be only available during runitme
                            // Apply the Change on the SmartTable (only on runtime)
                            oSmartTable._applyToolbarContentOrder();
                        }

                        resolve();
                    };

                    var oToolbarMoveSettings = aFoundElements.length > 0 ? aFoundElements[0] : null;
                    if (!oToolbarMoveSettings) {
                        oModifier.createControl("sap.ui.core.CustomData", mPropertyBag.appComponent, mPropertyBag.view, (oModifier.getId(oSmartTable) || uid()) + "-moveChange", {
                            key: "p13nData_ToolbarContentMove",
                            value: null
                        }).then(function(oToolbarMoveSettings){
                            var oInsertPromise = oModifier.insertAggregation(oSmartTable, "customData", oToolbarMoveSettings, 0, mPropertyBag.view);
                            if (!(oInsertPromise instanceof Promise)) {
                                oInsertPromise = Promise.resolve();
                            }
                            oInsertPromise.then(function() {
                                finalizeChange(oToolbarMoveSettings);
                            });
                        });
                    } else {
                        oModifier.getProperty(oToolbarMoveSettings, "value").then(function(oRevertData) {
                            if (!bIsRevert) {
                                oChange.setRevertData(Utils.parseChangeContent(oRevertData));
                            }
                            finalizeChange(oToolbarMoveSettings);
                        });
                    }

                });
            });
        });
    }

	return {
        applyChange : function(oChange, oSmartTable, mPropertyBag) {
            return doApplyChange(oChange, oSmartTable, mPropertyBag, false);
        },
        revertChange: function(oChange, oSmartTable, mPropertyBag) {
            return doApplyChange(oChange, oSmartTable, mPropertyBag, true);
        },
        completeChangeContent : function(oChange, mSpecificChangeInfo, mPropertyBag) {
            // not needed, no additional dependent selectors
        },
        getCondenserInfo : function(oChange, mPropertyBag) {
            return {
                affectedControl: oChange.getSelector(),
                classification: Classification.LastOneWins,
                uniqueKey: "p13nData_ToolbarContentMove"
            };
        }
	};
});