/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
 sap.ui.define(["sap/ui/base/Object"], function(Object) {
	"use strict";

    var RulesLog = Object.extend("sap.ui.comp.rules.RulesLog");

    RulesLog.prototype.setInvokedMethod = function(sPropertyName, mValue){
        if (this.mProperties === undefined || this.mProperties === null) {
            this.mProperties = {};
        }

        if (this.mProperties[sPropertyName] === undefined) {
            this.mProperties[sPropertyName] = mValue;
        }
    };

    RulesLog.prototype.getInvokedMethod = function(sPropertyName){
        var mResult = null;

        if (this.mProperties !== undefined && this.mProperties[sPropertyName] !== undefined) {
            mResult = this.mProperties[sPropertyName];
        }

        return mResult;
    };

    RulesLog.prototype.getInvokedMethods = function(){
        var mResult = null;

        if (this.mProperties !== undefined) {
            mResult = this.mProperties;
        }

        return mResult;
    };

	return RulesLog;
}, true);
