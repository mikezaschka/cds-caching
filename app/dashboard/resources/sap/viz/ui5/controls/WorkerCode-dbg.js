/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides the worker code used in sap.viz.ui5.controls.VizFrame.
(function() {
    "use strict";

    function getDefaultPropsFunction(){
        function isPlainObject(value) {
            if (!value || typeof value !== 'object' || ({}).toString.call(value) != '[object Object]' ) {
                return false;
            }
            var proto = Object.getPrototypeOf(value);
            if (proto === null) {
                return true;
            }
            var Ctor = self.hasOwnProperty.call(proto, 'constructor') && proto.constructor;
            return typeof Ctor == 'function' && Ctor instanceof Ctor && Function.prototype.toString.call(Ctor) === Function.prototype.toString.call(Object);
        }
        function _mergePropertiesByDef (definition, destination, source) {
            for (var sourceKey in source) {
                var sourceVal = source[sourceKey];
                var subDef = definition ? definition[sourceKey] : definition;
                if (sourceVal !== undefined) {
                    if (subDef === null || !isPlainObject(sourceVal)) {
                        destination[sourceKey] = sourceVal;
                    } else {
                        var destVal = destination[sourceKey];
                        if (!destVal || !isPlainObject(destVal)) {
                            destVal = destination[sourceKey] = {};
                        }
                        _mergePropertiesByDef(subDef, destVal, sourceVal);
                    }
                }
            }
        }
        function mergeProperties(propDef, destination, src) {
            destination = destination || {};
            for (var i = 2; i < arguments.length; i++) {
                var srcProp = arguments[i];
                _mergePropertiesByDef(propDef, destination, srcProp);
            }
            return destination;
        }
        self.onmessage = function(event) {
            var mergedProps = {};
            var allChartNames = event.data.allChartNames;
            for (var ii = 0; ii < allChartNames.length; ++ii) {
                var chartName = allChartNames[ii];
                if (event.data.applicationSet === 'fiori') {
                    mergedProps[chartName] = mergeProperties(event.data.allPropDefs[chartName], event.data.defaultFioriProps, event.data.generalProps, event.data.specificProps[chartName.replace('info/', '')]);
                    if (/dual/.test(chartName)){
                        mergeProperties[chartName] = mergeProperties(event.data.allPropDefs[chartName], mergedProps[chartName], event.data.dualFioriProps);
                    }
                } else {
                    mergedProps[chartName] = mergeProperties(event.data.allPropDefs[chartName], event.data.generalProps, event.data.specificProps[chartName.replace('info/', '')], event.data.defaultFormatString[chartName]);
                }
                mergedProps[chartName] = mergeProperties(event.data.allPropDefs[chartName], event.data.cvomTemplate[chartName], mergedProps[chartName], event.data.allUi5Theme[chartName], event.data.extraProp);
            }
            self.postMessage(mergedProps);
        };
    }

    if (typeof globalThis.sap?.ui?.define === 'function') {
        // embedded case, export the getDefaultPropsFunction via sap.ui.define
        sap.ui.define([], function() {
            return getDefaultPropsFunction;
        });
    } else {
        // standalone case, execute immediately
        getDefaultPropsFunction();
    }

}());
