/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/ui/thirdparty/jquery"],function(jQuery) {
    "use strict";

    function makeLookUp(aKeys) {
        return aKeys.reduce(function(mLookUp, sKey) {
            mLookUp[sKey] = true;
            return mLookUp;
        }, {});
    }
    function toVizCtx(aVisibleMeasures, aVisibleDimensions) {
        var mVisibleMsrs = makeLookUp(aVisibleMeasures);

        function dimWrapper(oContextObj) {
            return aVisibleDimensions.reduce(function(oPartialDataCtx, sDim) {
                if (oContextObj.hasOwnProperty(sDim)) {
                    oPartialDataCtx[sDim] = oContextObj[sDim];
                }
                return oPartialDataCtx;
            }, {});
        }

        return function(aRequestedMeasures, oContextObj) {
            return aRequestedMeasures.filter(function(sMsr) {
                return mVisibleMsrs[sMsr];
            }).map(function(sMsr) {
                var oDataCtx = dimWrapper(oContextObj);
                oDataCtx[sMsr] = "*";
                return {data: oDataCtx};
            });
        };
    }

    function toVizCSCtx(oCtx) {
        var oVizCtx = {data:{}},
            oMsrVal = oCtx.measures,
            oDimVal = oCtx.dimensions;

        if (oMsrVal) {
            oVizCtx.data.measureNames = (oMsrVal instanceof Array) ? {"in": oMsrVal} : oMsrVal;
        }

        jQuery.each(oDimVal || {}, function(k, v) {
            oVizCtx.data[k] = (v instanceof Array) ? {"in": v} : v;
        });

        return oVizCtx;
    }

    function fromVizCSCtx(oVizCtx) {
        var oData = oVizCtx.data;
        return Object.keys(oData).reduce(function(obj, k) {
            var v = oData[k];
            if (v.in && v.in instanceof Array) {
                v = v.in;
            }
            if (k === "measureNames") {
                obj.measures = v;
            } else if (!obj.dimensions) {
                obj.dimensions = {};
                obj.dimensions[k] = v;
            } else {
                obj.dimensions[k] = v;
            }
            return obj;
        }, {});
    }

    function buildSelectionVizCtx(aVisibleMeasures, aVisibleDimensions, oBinding, aContexts) {
        var converter = toVizCtx(aVisibleMeasures, aVisibleDimensions);
        return aContexts.reduce(function(aData, oCtx) {
            var aCtxs = oBinding.getContexts(oCtx.index, 1);
            if (aCtxs.length > 0) {
                aData = aData.concat(converter(oCtx.measures, aCtxs[0].getObject()));
            }
            return aData;
        }, []);
    }

    function filterVisibleMsr(data, mVisibleMsrs){
        return Object.keys(data).filter(function(sMsr){
            return (mVisibleMsrs.indexOf(sMsr) !== -1);
        });
    }

    function filterSemMsr(oSemanticTuples, mVisibleMsrs, mDataPoint){
        //Filter continues meausre accroding with projectedValueStartTime
        if (oSemanticTuples) {
            var sInvisibleSemMsr, tuple;
            for (tuple in oSemanticTuples) {
                if (oSemanticTuples.hasOwnProperty(tuple) && mDataPoint.data[tuple]) {
                    var semanticRule = oSemanticTuples[tuple];
                    sInvisibleSemMsr = (mDataPoint.data[semanticRule.timeAxis] < semanticRule.projectedValueStartTime) ? semanticRule.projected : semanticRule.actual;
                }
            }
            if (sInvisibleSemMsr) {
                //Hit continues series data point. Filter inVisible measure info.
                mDataPoint.measures = mDataPoint.measures.filter(function(sMsr){
                    return (sMsr !== sInvisibleSemMsr);
                });
                if (mDataPoint.dataName) {
                    mDataPoint.dataName = Object.keys(mDataPoint.dataName).reduce(function(dataName, key, i){
                        if (mVisibleMsrs.indexOf(key) !== -1){
                            dataName[key] = mDataPoint.dataName[key];
                        }
                        return dataName;
                    }, {});
                    if (jQuery.isEmptyObject(mDataPoint.dataName)) {
                        delete mDataPoint.dataName;
                    }
                }
            } else {
                var unboundMsrs = [];
                for (var key in oSemanticTuples) {
                    if (oSemanticTuples.hasOwnProperty(key)) {
                        tuple = oSemanticTuples[key];
                        unboundMsrs.push(tuple.actual);
                        unboundMsrs.push(tuple.projected);
                    }
                }
                //Hit normal series in a continues chart. Filter unbound measures.
                mDataPoint.measures = mDataPoint.measures.filter(function(sMsr){
                    return unboundMsrs.indexOf(sMsr) === -1;
                });
            }
        }
    }

    return {
        makeLookUp: makeLookUp,
        toVizCtx: toVizCtx,
        toVizCSCtx: toVizCSCtx,
        fromVizCSCtx: fromVizCSCtx,
        buildSelectionVizCtx: buildSelectionVizCtx,
        filterVisibleMsr : filterVisibleMsr,
        filterSemMsr: filterSemMsr,
        match: function(oRef, oVal, aMeasures) {
            return Object.keys(oRef).every(function(k) {
                if (aMeasures.indexOf(k) !== -1) {
                    return oVal.hasOwnProperty(k);
                } else {
                    return oRef[k] === oVal[k];
                }
            });
        }
    };
});