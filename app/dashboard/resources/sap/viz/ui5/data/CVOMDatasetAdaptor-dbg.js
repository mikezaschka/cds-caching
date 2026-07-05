/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	'sap/viz/ui5/controls/common/utils/Constants',
	'sap/ui/model/Sorter',
	"sap/ui/thirdparty/jquery",
	"sap/base/util/deepEqual"
], function(Constants, Sorter, jQuery, deepEqual) {
	"use strict";

    function isArray(it) {
        return Object.prototype.toString.call(it) === '[object Array]';
    }

    function createCrosstableDataset(dimensions, measures, dataContexts, additionalInfo, bForLegecyVizChart){

        var result = { dataset: null, context: null};
		// if there is no data, then there must be no crosstab. Charts will render "no data" then.
		if (!dataContexts || dataContexts.length === 0) {
			return result;
		}

		var aAxis1 = [], aAxis2 = [], aMeasures = [], data = [], aContextLookup = [];

		// transform dimension definitions into a structure more suitable for our
		// transformation
		jQuery.each(dimensions, function(i, oColumn) {
			if (oColumn.getAxis() === 1) {
				aAxis1.push({
					def : oColumn,
					adapter : oColumn._getAdapter()
				});
			} else if (oColumn.getAxis() === 2) {
				aAxis2.push({
					def : oColumn,
					adapter : oColumn._getAdapter()
				});
			} else {
				throw new Error("currently, only axis 1 and 2 are supported");
			}
		});

		// create empty data array for each measure
		jQuery.each(measures, function(i, oColumn) {
			aMeasures.push({
				def : oColumn,
				adapter : oColumn._getAdapter()
			});
			data.push([]);
		});

		// reads all values for a dimension definition from the model,
		// combines them into a tuple and searches that tuple in the list of known
		// values for that dimension. If it is found, the corresponding index
		// is returned. If not, the tuple is added at the end and the new index is
		// returned.
		function getAxisIndex(aAxisDef, aAxisValues, oContext) {
			var l = aAxisDef.length, aValues, i;

			if (l === 0) {
				return 0;
			}

			// extracts the key value for one dimension based on the given set of
			// dimension components
			aValues = [];
			for ( i = 0; i < l; i++) {
				aValues.push(aAxisDef[i].adapter(oContext));
			}

			// search the key value in the list of already known values
			// TODO PERFOPT: search is only needed when more than one axis is
			// defined and only because it is
			// not clear in what order the combinations of axis values are
			// enumerated in the model.
			// It could be x1y1,x2y1,..xNy1,x1y2,... or x1y1,x1y2,...x1yM,x2y1,...
			// or totally unsorted.
			for ( i = 0, l = aAxisValues.length; i < l; i++) {
				if (deepEqual(aAxisValues[i], aValues)) {
					return i;
				}
			}
			// if not found, add it
			aAxisValues.push(aValues);
			return aAxisValues.length - 1;
		}

		var aAxis1DataSet = [];
		var aAxis2DataSet = [];

		// analyze data
		jQuery.each(dataContexts, function(iIndex, oContext) {
			// TODO Distinguish 3 cases for better performance:
			// 1. both axes are defined, use code below
			// 2. only one axis is defined, use the getAxisIndex
			// without search + a fixed 0 for the second axis
			// 3. if no axes are defined, use an incrementing index
			// for the first axis and 0 for the second
			// The decision between the three cases can be taken
			// outside the loop.
			var iAxis1Index = getAxisIndex(aAxis1, aAxis1DataSet, oContext);
			var iAxis2Index = getAxisIndex(aAxis2, aAxis2DataSet, oContext);
			for (var i = 0; i < aMeasures.length; i++) {
				var value = aMeasures[i].adapter(oContext);
				// If both aa1 and aa2 is empty, viz dataset should
				// be created correctly and only with measure
				// values.
				if (aAxis1.length === 0 && aAxis2.length === 0) {
					if (data[i][0] === undefined) {
						data[i][0] = [];
					}
					data[i][0].push(value);
				} else {
					(data[i][iAxis2Index] = (data[i][iAxis2Index] || []))[iAxis1Index] = value;
				}
			}
			if (aAxis1.length === 0 && aAxis2.length === 0) {
				iAxis1Index = iIndex;
			}
			// remember the oContext for the current coordinates
			(aContextLookup[iAxis2Index] || (aContextLookup[iAxis2Index] = []))[iAxis1Index] = oContext;
		});

		// fill any gaps
		var iLengthAxis1 = aAxis1DataSet.length;
		var iLengthAxis2 = Math.max(aAxis2DataSet.length, 1);
		for (var j = 0; j < iLengthAxis2; j++) {
			for (var i = 0; i < aMeasures.length; i++) {
				// first ensure that a data array exists for each value of axis2
				var d = data[i][j];
				if (!d) {
					d = data[i][j] = [];
				}
				// then ensure that each array has the length of axis1
				if (d.length < iLengthAxis1) {
					d[iLengthAxis1 - 1] = undefined;
				}
			}
			// also ensure that a lookup array exists for each value of axis2
			if (!aContextLookup[j]) {
				aContextLookup[j] = [];
			}
			// ensure that the lookup array has the length of axis1
			if ((!aContextLookup[j].length) < iLengthAxis1) {
				aContextLookup[j][iLengthAxis1] = undefined;
			}
		}

		// start creating the dataset
		// If no dimension or no measure definition, viz dataset should also no
		// 'analysisAxis' or 'measureValuesGroup'.
		var dataset = {};

		// convert data for axis1
		if (aAxis1.length > 0) {
			if (dataset.analysisAxis === undefined) {
				dataset.analysisAxis = [];
			}
			var axis = {
				index : 1,
				data : []
			};
			// process component by component for the axis1 dimension
			for (var i = 0; i < aAxis1.length; i++) {
				// collect values for the dimension component 'i'
				var values = [];
				for (var j = 0; j < aAxis1DataSet.length; j++) {
					values[j] = aAxis1DataSet[j][i];
				}
				// create an axis component from the collected data and the
				// specified label
				axis.data.push({
					name : aAxis1[i].def.getName(),
					values : values
				});
			}
			// add axis to dataset
			dataset.analysisAxis.push(axis);
		}

		// do the same for axis2
		// TODO generalize to N axes, will reduce code as well. But maybe throw
		// error above for more than two axes (limit of crosstab?)
		if (aAxis2.length > 0) {
			if (dataset.analysisAxis === undefined) {
				dataset.analysisAxis = [];
			}
			var axis = {
				index : 2,
				data : []
			};
			for (var i = 0; i < aAxis2.length; i++) {
				var values = [];
				for (var j = 0; j < aAxis2DataSet.length; j++) {
					values[j] = aAxis2DataSet[j][i];
				}
				axis.data.push({
					name : aAxis2[i].def.getName(),
					values : values
				});
			}
			dataset.analysisAxis.push(axis);
		}

		// now that the dimension lengths are known, transform measures to
		// crosstable
		if (aMeasures.length > 0) {
			dataset.measureValuesGroup = [];

			for (var i = 0; i < aMeasures.length; i++) {
				if (!dataset.measureValuesGroup[aMeasures[i].def.getGroup() - 1]) {
					dataset.measureValuesGroup[aMeasures[i].def.getGroup() - 1] = {
						index : aMeasures[i].def.getGroup(),
						data : []
					};
				}
				dataset.measureValuesGroup[aMeasures[i].def.getGroup() - 1].data.push({
					name : aMeasures[i].def.getName(),
					values : data[i]
				});
			}

			// Viz don't handle mg array with undefined.
			for (var i = 0, len = dataset.measureValuesGroup.length; i < len; i++) {
				if (dataset.measureValuesGroup[i] === undefined) {
					throw new Error("Measure Group " + (i + 1) + " is missing.");
				}
			}
		}

		// finally create the VIZ crosstab from the transformed data
		// cvom has two version of crosstable implmentation, viz chart only regonize the viz chart version crosstable
		result.dataset = bForLegecyVizChart ? new sap.viz.data.CrosstableDataset() : new sap.viz.api.data.CrosstableDataset();
		result.dataset.data(dataset);
		if (additionalInfo) {
			result.dataset.info(additionalInfo);
		}

		result.context = aContextLookup;

		return result;
	}

	function defaultSortComparator(valA, valB) {
        var a = (valA && valA.value) || valA,
            b = (valB && valB.value) || valB;
		return Sorter.defaultComparator(a, b);
	}

    function createFlatTableDateset(dimensions, measures, contexts, dataContexts, pagingOption, pagingUnit){

        var result = {dataset: null, context: null};

        //By default, we will show all context dimension in tooltip
        var context = ['_context_row_number'];
        if (contexts) {
            if (!isArray(contexts)) {
                contexts = [contexts];
            }
            for (var i = 0; i < contexts.length; ++i) {
                var name = contexts[i];
                var bShowInTooltip =  !(name.showInTooltip === false);
                if (name.id) {
                    name = name.id;
                }
                context.push({id : name, showInTooltip : bShowInTooltip});

            }
        }
        var aAxis = [], aMeasures = [], aMeasuresUnit = [], flatTableDS = {
            'metadata' : {
                'fields' : []
            },
            'context' : context,
            'data' : []
        }, aContextLookup = [];

		jQuery.each(dimensions, function(i, oColumn) {
			aAxis.push({
				def : oColumn,
				vAdapter : oColumn._getAdapter(),
				dAdapter : oColumn._getDisplayValueAdapter()
			});
			var dataType = oColumn.getDataType();
			var oriSorter = oColumn.getSorter();
			var field = {
				'id' : oColumn.getIdentity() || oColumn.getName(),
				'name' : oColumn.getName() || oColumn.getIdentity(),
				'semanticType' : 'Dimension',
				'dataType': dataType,
				'inResult': oColumn._getInResult(),
				'timeUnitType': oColumn._getTimeUnit()
			};
			if (oriSorter && typeof oriSorter === "object"){
				var sorter = {
					bDescending: oriSorter.bDescending
				};
				sorter.fnComparator = function(objA, objB){
					var finalA = { value : objA && objA.v || objA, displayValue : objA && objA.d},
						finalB = { value : objB && objB.v || objB, displayValue : objB && objB.d};
					var fnComparator = (oriSorter.fnComparator && typeof oriSorter.fnComparator === "function") ?
						oriSorter.fnComparator : defaultSortComparator;
					return fnComparator(finalA, finalB);
				};
				field["sorter"] = sorter;
			}
			flatTableDS.metadata.fields.push(field);
		});

		jQuery.each(measures, function(i, oColumn) {
			aMeasures.push({
				def : oColumn,
				adapter : oColumn._getAdapter()
			});
			var cfg = {
				'id' : oColumn.getIdentity() || oColumn.getName(),
				'name' : oColumn.getName() || oColumn.getIdentity(),
				'semanticType' : 'Measure'
			};
			cfg.formatString = oColumn.getFormat();
			/*If customer set unit as undefined/null/'', getUnit function will always retrun '',
			so we don't handle such case in ui5*/
			if (oColumn.getUnit()) {
				cfg.unit = oColumn.getUnit();
			}
			cfg.unitBinding = oColumn._getUnitBinding();

			var aRange = oColumn.getRange();
			if (aRange && aRange.length) {
				cfg.min = aRange[0];
				cfg.max = aRange[1];
			}
			flatTableDS.metadata.fields.push(cfg);
		});

		if (pagingOption) {
			if (pagingOption.bEnabled) {
				 flatTableDS.metadata.options = {
					pagination: {
						mode: pagingOption.sMode,
						ratio: pagingOption.thumbRatio
					}
				};
			}
		}

		// handle no data
        if (!dataContexts || dataContexts.length === 0) {
            result.dataset = new sap.viz.api.data.FlatTableDataset(flatTableDS);
            return result;
        }

        if (pagingOption && (!pagingUnit || pagingOption.sMode === "reset")) {
            pagingUnit = [];
        }

		// analyze data
		jQuery.each(dataContexts, function(iIndex, oContext) {
			if (!flatTableDS.data[iIndex]) {
				flatTableDS.data[iIndex] = [];
			}
			for (var i = 0; i < aAxis.length; i++) {
				var value = aAxis[i].vAdapter(oContext);
				if (value instanceof Date) {
					value = value.getTime();
				}
				var dValueObj = aAxis[i].dAdapter(oContext);
				flatTableDS.data[iIndex].push(
					dValueObj.enableDisplayValue ?
					{v: value, d: dValueObj.value} : value
				);
			}
			for (var j = 0; j < aMeasures.length; j++) {
				var value = aMeasures[j].adapter(oContext);
				flatTableDS.data[iIndex].push(value);
				 //Check for analytical chart. "*" is for annotation usage.
                var sUnitBinding = aMeasures[j].def._getUnitBinding();
                if (sUnitBinding) {
                    var sUnitValue = oContext.getProperty(sUnitBinding);
                    sUnitValue = sUnitValue && sUnitValue.trim && sUnitValue.trim();
					if (sUnitValue) {
						if (aMeasuresUnit[j]) {
							if (aMeasuresUnit[j] === "*" || aMeasuresUnit[j] !== sUnitValue || (pagingOption && pagingUnit[j] !== sUnitValue)) {
								throw Constants.ERROR_MESSAGE.MULTIPLEUNITS;
							}
						} else {
							aMeasuresUnit[j] = sUnitValue;
							if (pagingOption && !pagingUnit[j]) {
								pagingUnit[j] = sUnitValue;
							}
						}
					}
                }
			}
			aContextLookup[iIndex] = oContext;
		});

		result.context = aContextLookup;

		//Set unit for analytical chart.
        flatTableDS.metadata.fields.filter(function(field) {
            return (field.semanticType === "Measure");
        }).forEach(function(fieldMeasure, index){
            if (fieldMeasure.unitBinding && aMeasuresUnit[index]) {
                fieldMeasure.unit = aMeasuresUnit[index];
                delete fieldMeasure.unitBinding;
            }
        });
		// finally create the VIZ flat table from the transformed data
		result.dataset = new sap.viz.api.data.FlatTableDataset(flatTableDS);

		return result;
    }

	var CVOMDatasetAdaptor = function() {
		this._oCVOMDataset = null;
		this._aContext = null;
		this._sDatasetType = null;
		this._pagingUnit = null;
	};

	/**

       return CVOM Dataset instance;
	**/
	CVOMDatasetAdaptor.prototype.getDataset = function(options){
        if (this._sDatasetType === options.type && this._oCVOMDataset){
            return this._oCVOMDataset;
        }

        this.invalidate();
        this._sDatasetType = options.type;

        var oResult = null;
        if (this._sDatasetType === Constants.DATASET_TYPES.FLATTABLEDATASET){
            oResult = createFlatTableDateset(options.dimensions, options.measures, options.contexts, options.dataContexts, options.pagingOption, this._pagingUnit);
        } else {
            oResult = createCrosstableDataset(options.dimensions, options.measures, options.dataContexts, options.additionalInfo,
                       this._sDatasetType == Constants.DATASET_TYPES.CROSSTABLEDATASET ? false : true);
        }


        this._oCVOMDataset = oResult.dataset;
        this._aContext = oResult.context;

        return this._oCVOMDataset;
	};

	CVOMDatasetAdaptor.prototype.findContext = function(oCriteria){
        if (this._sDatasetType === Constants.DATASET_TYPES.FLATTABLEDATASET){
		  if (this._aContext && typeof oCriteria === 'object' && oCriteria._context_row_number !== undefined) {
			  return this._aContext[oCriteria._context_row_number];
		  }
        } else {
          if (this._aContext && typeof oCriteria === 'object') {
			  return this._aContext[oCriteria.dii_a2] && this._aContext[oCriteria.dii_a2][oCriteria.dii_a1];
		  }
        }

        return null;
	};

	CVOMDatasetAdaptor.prototype.invalidate = function() {
		this._oCVOMDataset = null;
		this._aContext = null;
	};


	return CVOMDatasetAdaptor;

}, /* bExport= */ true);
