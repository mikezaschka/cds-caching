/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define([
	'sap/chart/data/Dimension',
	'sap/chart/data/TimeDimension',
	'sap/chart/data/HierarchyDimension',
	'sap/chart/data/Measure',
	'sap/chart/TimeUnitType',
	'sap/ui/base/Object',
	"sap/ui/thirdparty/jquery"
], function(Dimension, TimeDimension, HierarchyDimension, Measure, TimeUnitType, BaseObject, jQuery) {
	"use strict";

	function getEntitySet(bIsAnalytical, oBinding) {
		var sPath = oBinding.path;
		var sNamedEntitySet = (oBinding.parameters || {}).entitySet;
		if (!sNamedEntitySet) {
			// assume absolute path complying with conventions from OData4SAP spec
			sNamedEntitySet = sPath.split("/")[1];

			if (sNamedEntitySet.indexOf("(") != -1) {
				sNamedEntitySet = sNamedEntitySet.split("(")[0] + (bIsAnalytical ? "Results" : "Set");
			}
		}
		return sNamedEntitySet;
	}

	function _bindingSyntax(sResultType, sDimensionName, type) {
		return "{/#" + sResultType + "/" + sDimensionName + "/@sap:" + type + "}";
	}

	var TIMEUNIT_TYPE_TRANS = {
		  "com.sap.vocabularies.Common.v1.IsCalendarDate": "yearmonthday",
		  "com.sap.vocabularies.Common.v1.IsCalendarYearQuarter": "yearquarter",
		  "com.sap.vocabularies.Common.v1.IsCalendarYearMonth": "yearmonth",
		  "com.sap.vocabularies.Common.v1.IsCalendarYearWeek": "yearweek",
		  "com.sap.vocabularies.Common.v1.IsFiscalYear": "fiscalyear",
		  "com.sap.vocabularies.Common.v1.IsFiscalYearPeriod": "fiscalyearperiod"
	};

	function detectDimension(oProps, oConfig) {
		//Fiscal timeUnits can be handled as well.
		var Clazz = Dimension;
		if (oProps.type === "Edm.DateTime" && oProps['sap:display-format'] === "Date") {
			//TODO: sap:display-format is V2 annotation, use V4 style when annotation translation is ready
			Clazz = TimeDimension;
			oConfig.timeUnit = TimeUnitType.Date;
		} else if (oProps['sap:hierarchy-node-for']) {
			//TODO: sap:hierarchy-node-for is V2 annotation, use V4 style when annotation translation is ready
			Clazz = HierarchyDimension;
		} else if (oProps.type === "Edm.String") {
			var timeTypes = Object.keys(TIMEUNIT_TYPE_TRANS);
			for (var idx = 0; idx < timeTypes.length; idx++) {
				var timeType = timeTypes[idx];
				if (oProps[timeType] && oProps[timeType].Bool) {
					var timeUnit = TIMEUNIT_TYPE_TRANS[timeType];
					if (TimeUnitType[timeUnit]) {
						Clazz = TimeDimension;
						oConfig.timeUnit = timeUnit;
					}
					break;
				}
			}
		}
		return Clazz;
	}

	var _ANALYTICAL = {
		getEntitySet: getEntitySet.bind(null, true),
		deriveColumns: function(oModel, oBindingInfo) {
			var oResult = oModel.getAnalyticalExtensions().findQueryResultByName(_ANALYTICAL.getEntitySet(oBindingInfo));
			if (!oResult) {
				throw new Error("value of the \"isAnalytical\" property does not match the Data Service in use");
			}
			var sResultType = oResult.getEntityType().getQName();
			sResultType = sResultType.slice(sResultType.lastIndexOf(".") + 1);
			var sResultSchemaNamespace = oResult.getEntityType().getSchema().namespace;

			var fnMakeDim = _ANALYTICAL.makeDimension.bind(this, sResultType, sResultSchemaNamespace, oResult);
			var fnMakeMsr = _ANALYTICAL.makeMeasure.bind(this, sResultType);

			var aHierarchyNodeIDPropertyNames = oResult.getEntityType().getAllHierarchyPropertyNames().map(function(sDimName) {
				return oResult.findDimensionByPropertyName(sDimName).getHierarchy().getNodeIDProperty().name;
			});

			var aDimensions = oResult.getAllDimensionNames().concat(aHierarchyNodeIDPropertyNames);

			return {
				dimensions: jQuery.map(aDimensions, fnMakeDim),
				measures: jQuery.map(oResult.getAllMeasures(), fnMakeMsr)
			};
		},
		makeDimension: function(sResultType, sResultSchemaNamespace, oResult, sDimName) {
			var oConfig = {
				name: sDimName,
				label: _bindingSyntax(sResultType, sDimName, "label"),
				textProperty: _bindingSyntax(sResultType, sDimName, "text")
			};

			var sAnnotationAccess = _ANALYTICAL.ANNOTATION_ACCESS_TEMPLATE
					.replace(/%SCHEMANS/, sResultSchemaNamespace)
					.replace(/%RESULTTYPE/, sResultType)
					.replace(/%DIMENSION/, sDimName);

			var oUnifiedDimensionProperties = oResult.getModel().getODataModel().getMetaModel().getProperty(sAnnotationAccess);

			var Clazz = detectDimension(oUnifiedDimensionProperties, oConfig);

			return new Clazz(oConfig);
		},
		makeMeasure: function(sResultType, oMeasure) {
			return new Measure({
				name: oMeasure.getName(),
				label: _bindingSyntax(sResultType, oMeasure.getName(), "label")
			});
		},
		updateModel: function(oChart) {
			function createDimAnalyticalInfos(oDim, iHierarchyLevel, bInResult, bInVisible) {
				var	aInfos = [];
				var oInfo = {
					name: oDim.getName(),
					grouped: false,
					inResult: !!bInResult,
					visible: !bInVisible
				};
				if (iHierarchyLevel != null) {
					oInfo.level = iHierarchyLevel;
				}
				aInfos.push(oInfo);

				var sTextProperty = oDim.getTextProperty();
				if (oDim.getDisplayText() && sTextProperty) {
					oInfo = {
						name: sTextProperty,
						grouped: false,
						inResult: !!bInResult,
						visible: !bInVisible
					};
					aInfos.push(oInfo);
				}

				return aInfos;
			}

			function createMsrAnalyticalInfos(oMsr, allDimsAndMsrs) {
				var sUnitBinding = oMsr.getUnitBinding(), bEnablePaging = oChart._isEnablePaging(),
					oAnalyticalInfo = oMsr.getAnalyticalInfo(), aInfos = [];
				if (oAnalyticalInfo) {
					aInfos.push({name: oAnalyticalInfo.propertyPath, "with": oAnalyticalInfo.with, as: oMsr.getName(), total: false});
				} else {
					aInfos.push({name: oMsr.getName(), total: false, inResult: false, visible: true});
				}
				var V4ODataModel = sap.ui.require("sap/ui/model/odata/v4/ODataModel");
				if (bEnablePaging && V4ODataModel && (oChart.getModel() instanceof V4ODataModel)) {
					aInfos[0].min = true;
					aInfos[0].max = true;
				}
				if (sUnitBinding && allDimsAndMsrs.indexOf(sUnitBinding) === -1) {
					aInfos.push({ name: sUnitBinding, inResult: false, visible: true });
				}
				return aInfos;
			}

			var oBinding = oChart.getBinding("data");
			if (!oBinding) {
				return;
			}

			var aDims = oChart._getVisibleDimensions(true);
			var aMsrs = oChart._getVisibleMeasures(true);
			var aInResultDims = oChart._normalizeDorM(oChart.getInResultDimensions(), true);
			var oHierarchyLevel = oChart._getDrillStateTop().hierarchylevel;

			var allDimsAndMsrs = aDims.map(function(oDim){
				return oDim.getName();
			}).concat(aInResultDims.map(function(oDim){
				return oDim.getName();
			})).concat(aMsrs.map(function(oMsr){
				return oMsr.getName();
			}));
			var aInfos = aDims.reduce(function(aInfos, oDim) {
				return aInfos.concat(createDimAnalyticalInfos(oDim, oHierarchyLevel[oDim.getName()]));
			}, []).concat(aInResultDims.reduce(function(aInfos, oDim) {
				// inResult dimension does not appear in drill path, get hierarchy level from dimension instance
				var iHierarchyLevel = oDim instanceof HierarchyDimension ? oDim.getLevel() : null;
				return aInfos.concat(createDimAnalyticalInfos(oDim, iHierarchyLevel, true, true));
			}, [])).concat(aMsrs.reduce(function(aInfos, oMsr) {
				return aInfos.concat(createMsrAnalyticalInfos(oMsr, allDimsAndMsrs));
			}, []));

			var oCandidateColoringSetting = oChart._getCandidateColoringSetting();
			var oColoringAdditionalMsrs = oCandidateColoringSetting.additionalMeasures || [];
			var oColoringAdditionalDims = oCandidateColoringSetting.additionalDimensions || [];
			if (oColoringAdditionalMsrs.length) {
				aInfos = aInfos.concat(oChart._normalizeDorM(oColoringAdditionalMsrs).reduce(function(aInfo, oMsr) {
					return aInfo.concat(createMsrAnalyticalInfos(oMsr));
				}, []));
			}
			if (oColoringAdditionalDims.length) {
				aInfos = aInfos.concat(oChart._normalizeDorM(oColoringAdditionalDims, true).reduce(function(aInfo, oDim) {
					return aInfo.concat(createDimAnalyticalInfos(oDim, oHierarchyLevel[oDim.getName()]));
				}, []));
			}

			var oResult = oBinding.updateAnalyticalInfo(aInfos);
			return oResult && oResult.measureRangePromise;
		},
		ANNOTATION_ACCESS_TEMPLATE: "/dataServices/schema/[${" +
			// ${xxx} will be interpolated by UI5 compiler, so we have to break all these annotations into separate strings
			"namespace" + "}==='%SCHEMANS']/entityType/[${" +
			"name" + "}==='%RESULTTYPE']/property/[${" +
			"name" + "}==='%DIMENSION']/"
	};

	var _NON_ANALYTICAL = {
		getEntitySet: getEntitySet.bind(null, false),
		deriveColumns: function(oModel, oBindingInfo) {
			var oMetaModel = oModel.getMetaModel(),
				mColumns = {dimensions: [], measures: []};
			if (oMetaModel) {
				var sQNameEntityType = oMetaModel.getODataEntitySet(_NON_ANALYTICAL.getEntitySet(oBindingInfo)).entityType;
				var oEntityType = oMetaModel.getODataEntityType(sQNameEntityType);

				jQuery.each(oEntityType.property, function(i, oProp) {
					var ColumnClazz = _NON_ANALYTICAL.CLAZZ[oProp.type];
					if (!ColumnClazz) {
						throw new Error("Unsupported type: " + oProp.type);
					}
					var oConfig = { name: oProp.name };
					if (oProp.hasOwnProperty("com.sap.vocabularies.Common.v1.Label")) {
						oConfig.label = oProp["com.sap.vocabularies.Common.v1.Label"].String;
					}

					if (ColumnClazz === Measure) {
						mColumns.measures.push(new ColumnClazz(oConfig));
					} else {
						if (oProp.hasOwnProperty("com.sap.vocabularies.Common.v1.Text")) {
							oConfig.textProperty = oProp["com.sap.vocabularies.Common.v1.Text"].Path;
						}

						ColumnClazz = detectDimension(oProp, oConfig);
						mColumns.dimensions.push(new ColumnClazz(oConfig));
					}
				});
			}

			return mColumns;
		},
		CLAZZ: {
			"Null": Dimension,
			"Edm.Binary": Dimension,
			"Edm.Boolean": Dimension,
			"Edm.Byte": Measure,
			"Edm.DateTime": Dimension,
			"Edm.Decimal": Measure,
			"Edm.Double": Measure,
			"Edm.Single": Measure,
			"Edm.Guid": Dimension,
			"Edm.Int16": Measure,
			"Edm.Int32": Measure,
			"Edm.Int64": Measure,
			"Edm.SByte": Measure,
			"Edm.String": Dimension,
			"Edm.Time": Dimension,
			"Edm.DateTimeOffset": Dimension
		},
		updateModel: function(oChart, aDimensions, aMeasures) {
			/**
			 * @deprecated As of version 1.48, together with ODataModel (V1).
			 */
			if (BaseObject.isA(oChart.getModel(), "sap.ui.model.odata.ODataModel")) {
				var aDimColumns = aDimensions.reduce(function(aDimColumns, oDim) {
					if (oDim.getTextProperty()) {
						return aDimColumns.concat(oDim.getName(), oDim.getTextProperty());
					} else {
						return aDimColumns.concat(oDim.getName());
					}
				}, []);
				var aMsrColumns = aMeasures.reduce(function(aMsrColumns, oMsr) {
					if (oMsr.getUnitBinding()) {
						return aMsrColumns.concat(oMsr.getName(), oMsr.getUnitBinding());
					} else {
						return aMsrColumns.concat(oMsr.getName());
					}
				}, []);

				//TODO: use cached bindingInfo here and rebindData, consider move this logic to bindAggregation
				oChart._oBindingInfo.parameters = oChart._oBindingInfo.parameters || {};
				oChart._oBindingInfo.parameters.entitySet = _NON_ANALYTICAL.getEntitySet(oChart._oBindingInfo);
				oChart._oBindingInfo.parameters.select = aDimColumns.concat(aMsrColumns).join(",");
				oChart.bindData(oChart._oBindingInfo);
				if (oChart._isEnablePaging() && oChart._getPagingController().getPagingSorters()) {
					oChart.getBinding("data").sort(oChart._getPagingController().getPagingSorters());
				}
			} else {
				return;
			}
		}
	};

	function impl(methodName) {
		return function(bIsAnalytical) {
			var implementation = bIsAnalytical ? _ANALYTICAL : _NON_ANALYTICAL;
			return implementation[methodName];
		};
	}

	return {
		deriveColumns: impl("deriveColumns"),
		updateModel: impl("updateModel"),
		getEntitySet: impl("getEntitySet")
	};
});