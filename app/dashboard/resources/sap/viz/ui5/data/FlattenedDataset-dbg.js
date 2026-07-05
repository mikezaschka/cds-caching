/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides control sap.viz.ui5.data.FlattenedDataset.
sap.ui.define([
	'sap/viz/library',
	"sap/ui/model/ChangeReason",
	"./Dataset",
	"./DimensionDefinition",
	"./MeasureDefinition",
	"./CVOMDatasetAdaptor",
	"sap/viz/ui5/controls/common/utils/Constants",
	"sap/base/Log",
	"sap/ui/thirdparty/jquery"
],
	function(library, ChangeReason, Dataset, DimensionDefinition, MeasureDefinition, CVOMDatasetAdaptor, Constants, Log, jQuery) {
	"use strict";

	/**
	 * Constructor for a new ui5/data/FlattenedDataset.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * A dataset for flattened (redundant) data using a tabular format.
	 * @extends sap.viz.ui5.data.Dataset
	 *
	 * @constructor
	 * @public
	 * @since 1.7.2
	 * @alias sap.viz.ui5.data.FlattenedDataset
	 */
	var FlattenedDataset = Dataset.extend("sap.viz.ui5.data.FlattenedDataset", /** @lends sap.viz.ui5.data.FlattenedDataset.prototype */ { metadata : {

		library : "sap.viz",

		designtime: "sap/viz/designtime/FlattenedDataset.designtime",

		properties:{
			/**
			 * Additional data which works with data context in this dataset. The input could be an array. Each item represents a dimension that is added as the additional information based on data context. The input could be a string of dimension id,
			 * or object like this {id: "name", showInTooltip: true}. If showInTooltip is false, the dimensions set in this API will not show in
			 * popover or tooltip. However other dimensions in data context will show. In selection event, all dimension information (including the dimension set in this API) will be included.
			 * Context will be shown by default in tooltip if only set context with string or string of array.
			 */
			context:{type: "any", multiple: false, singularName: "context"}
		},

		aggregations : {

			/**
			 * List of definitions of all dimensions in this dataset
			 */
			dimensions : {type : "sap.viz.ui5.data.DimensionDefinition", defaultClass: DimensionDefinition, multiple : true, singularName : "dimension"},

			/**
			 * list of definitions of all measures in this dataset
			 */
			measures : {type : "sap.viz.ui5.data.MeasureDefinition", defaultClass: MeasureDefinition, multiple : true, singularName : "measure"},

			/**
			 * Data containing dimensions and measures.
			 *
			 * <b>Note:</b> This aggregation can only be bound against a model, it cannot be managed
			 * programmatically using the aggregation mutator methods like addData.
			 */
			data : {type : "sap.ui.core.Element", multiple : true, singularName : "data", bindable : "bindable"}
		},

		events :{
			/**
			 * data change event
			 */
			dataChange:{

			},
			/**
			 * data refresh event
			 */
			dataRefresh:{

			},
			/**
			 * data error event
			 */
			dataError:{

			}
		}
	}});

	// enable calling 'bindAggregation("data")' without a factory
	FlattenedDataset.getMetadata().getAllAggregations()["data"]._doesNotRequireFactory = true;

	FlattenedDataset.prototype.init = function() {
		this._oCVOMDatasetAdaptor = new CVOMDatasetAdaptor();
		//required specific range
		this._iStartIndex = -1;
		this._iLength = -1;
		this._bReady = true;
		this._bInitializeBinding = true;
	};

	FlattenedDataset.prototype._bindAggregation = function() {
		this._bInitializeBinding = true;
		this._bUpdateAnalyticalInfo = false;
		Dataset.prototype._bindAggregation.apply(this, arguments);
		this._bInitializeBinding = false;
		var oBinding = this.getBinding("data");
		if (oBinding) {
			oBinding.attachDataReceived(this._dataReceivedListener, this);
		}
	};

	FlattenedDataset.prototype._dataReceivedListener = function(oEvent) {
		// AnalyticalBinding fires dataReceived too early
		if (oEvent && oEvent.getParameter && oEvent.getParameter("__simulateAsyncAnalyticalBinding")) {
			return;
		}
		if (oEvent.getParameter('data') === undefined) {
			this._bDataReceiveError = true;
			this.fireEvent('dataError');
		}
	};

	FlattenedDataset.prototype.refreshData = function(reason) {
		this._bDataReceiveError = false;
		this._bReady = false;
		if (this._bInitializeBinding) {
			var oBinding = this.getBinding("data");
			if (oBinding && oBinding.getTotalSize && oBinding.isRelative()) {
				this._bUpdateAnalyticalInfo = true;
			}
		}
		var refreshParameters = {reason: reason};
		if (!this._bInitializeBinding && this._bUpdateAnalyticalInfo && reason === 'refresh') {
			refreshParameters.updateAnalyticalInfo = true;
		}
		this.fireEvent("dataRefresh", refreshParameters);
		this._getDataContexts();
	};

	FlattenedDataset.prototype.updateData = function(reason) {
		var V4ODataModel = sap.ui.require("sap/ui/model/odata/v4/ODataModel");
		var bV4ODataModel = V4ODataModel && this.getBinding("data").getModel() instanceof V4ODataModel;
		if (!this._bInitializeBinding || !bV4ODataModel) {
			// workaround, OData V4 binding currently fires 'change' event during initialization, do not call binding.getContexts() before binding.updateAnalyticalInfo()
			// getContexts() will be later called through binding.filter() during rendering process
			// TODO: Need to verify if requests from other controls are able to merged into one batch with request from chart by doing so
			this._bDataReceiveError = false;
			this._bReady = true;
			this.fireEvent("dataChange", {reason: reason});
			this.invalidate();
		}
	};

	// override standard aggregation methods for 'data' and report an error when they are used
	jQuery.each("add get indexOf insert remove removeAll".split(" "), function(i, sMethod) {
		var sMessage = "FlattenedDataset manages the 'data' aggregation only via data binding. The method '" + sMethod + "Data' therefore cannot be used programmatically!";
		FlattenedDataset.prototype[sMethod + "Data"] = function() {
			Log.error(sMessage);
		};
	});

	/**
	 * return info chart flattable dataset which is in sap.viz.chart.js
	 * @returns {sap.viz.api.data.FlatTableDataset}
	 */
	FlattenedDataset.prototype.getVIZFlatDataset = function() {
		return this._getCVOMDataset(Constants.DATASET_TYPES.FLATTABLEDATASET);
	};

	/**
	 * return info chart crosstable dataset which is in sap.viz.chart.js
	 * @returns {sap.viz.api.data.CrosstableDataset}
	 */
	FlattenedDataset.prototype.getVIZCrossDataset = function() {
		return this._getCVOMDataset(Constants.DATASET_TYPES.CROSSTABLEDATASET);
	};

	/**
	 * return viz chart crosstable dataset which is in sap.viz.js
	 * @returns {sap.viz.data.CrosstableDataset}
	 */
	FlattenedDataset.prototype.getVIZDataset = function() {
		return this._getCVOMDataset(Constants.DATASET_TYPES.LEGACYCROSSTABLEDATASET);
	};

	/**
	 * type:
	 * @returns CVOM Dataset
	 */
	FlattenedDataset.prototype._getCVOMDataset = function(type) {
		// filter undefined
		var dataContexts = this._getDataContexts() && this._getDataContexts().filter(function(ele) { return !!ele; });
		return this._oCVOMDatasetAdaptor.getDataset({
			type: type,
			dataContexts: dataContexts,
			dimensions: this.getDimensions(),
			measures: this.getMeasures(),
			additionalInfo:this._info || this._defaultSelectionInfo,
			contexts:this.getContext(),
			pagingOption:this._oPagingOption
		});
	};


	FlattenedDataset.prototype.invalidate = function(oOther) {
		if (this._oCVOMDatasetAdaptor) {
			this._oCVOMDatasetAdaptor.invalidate();
		}
		Dataset.prototype.invalidate.apply(this, arguments);
	};

	/**
	 * Set chart's default selection.
	 * This api will do nothing when use VizFrame.
	 *
	 * @param {object[]} selectionInfos Array of default selection info
	 * @deprecated Since 1.19.
	 * Please use selection API {@link sap.viz.ui5.core.BaseChart.prototype.selection}.
	 * @public
	 */
	FlattenedDataset.prototype.setDefaultSelection = function(selectionInfos) {
		// Deprecated
		// Will not apply to crosstable already created
		this._defaultSelectionInfo = {
			'type' : 'defaultSelection',
			'value' : selectionInfos
		};
	};

	/**
	 * Get/Set additional info for the crosstable dataset By now, only "additionalData" info type is supported.
	 * This api will do nothing when use VizFrame.
	 *
	 * @param {object[]} values Array of Objects is for setting info and passes different types of infos objects.
	 */
	FlattenedDataset.prototype.info = function(values) {
		if ( values instanceof Array) {
			// Deprecated, not public
			// Will not apply to crosstable already created
			this._info = values;
		}
	};

	/**
	 * Find the model context for a given 'criteria' into chart data.
	 *
	 * The native sap.viz library provides data objects with the
	 * <code>selectData</code> event. Applications can call this method for each data
	 * in a selectData event to find the corresponding UI5 model context.
	 *
	 * When the dataset has not been converted into a VIZ dataset yet
	 * (e.g. no rendering yet)  or when the coordinates of the path are not within
	 * the range of the current dataset, then undefined will be returned.
	 *
	 * Example when use sap.viz.ui5.*:
	 * <pre>
	 * selectData: function(oEvent) {
	 *   var aSelectData = oEvent.getParameter("data");
	 *   var oContext = this.getDataset().findContext(aSelectData[0].data[0].ctx.path);
	 * }
	 * </pre>
	 * Example when use sap.viz.ui5.controls.VizFrame:
	 * <pre>
	 * selectData: function(oEvent) {
	 *   var aSelectData = oEvent.getParameter("data");
	 *   var oContext = this.getDataset().findContext(aSelectData[0].data);
	 * }
	 * </pre>
	 *
	 * @param {object} oCriteria a structure as provided by the sap.viz library
	 * @return {sap.ui.model.Context} the model context for the given criteria or undefined.
	 * @experimental Since 1.16.6. Might later be integrated into the selectData event.
	 * @public
	 */
	FlattenedDataset.prototype.findContext = function(oCriteria) {
		if (this._oCVOMDatasetAdaptor) {
			return this._oCVOMDatasetAdaptor.findContext(oCriteria);
		}
	};

	/*
	 * Internal interface to set data's range
	 */
	FlattenedDataset.prototype.setPagingOption = function(oPagingOption) {
		this._oPagingOption = oPagingOption;
	};

	FlattenedDataset.prototype.getRenderedPageNo = function() {
		if (this._oCVOMDatasetAdaptor) {
			return this._oCVOMDatasetAdaptor.getRenderedPageNo();
		}
	};

	FlattenedDataset.prototype.setRange = function(iStart, iLength){
		this._iStartIndex = iStart;
		this._iLength = iLength;
	};

	FlattenedDataset.prototype.getRange = function(iStart, iLength){
		return {
		   iStartIndex : this._iStartIndex,
		   iLength : this._iLength
		};
	};

	// check if the data is ready to consume
	FlattenedDataset.prototype.isReady = function(){
		if (this._bDataReceiveError) {
			// allow vizFrame to continue render as no data if error occurred in backend in OData service
			return true;
		}
		return this._bReady;
	};

	FlattenedDataset.prototype._getDataContexts = function(){
		var start = this._iStartIndex,
			length = this._iLength,
			binding = this.getBinding("data"),
			V4ODataModel = sap.ui.require("sap/ui/model/odata/v4/ODataModel");
		if (!binding){
			return null;
		}

		var bindingInfo;

		if (start == -1){
			bindingInfo = this.getBindingInfo("data");
			start = (bindingInfo && bindingInfo.startIndex !== undefined) ? bindingInfo.startIndex : 0 ;
		}
		var noPaging = !this._oPagingOption;
		if (length == -1){
			bindingInfo = bindingInfo || this.getBindingInfo("data");
			if (bindingInfo && bindingInfo.length !== undefined){
				length = bindingInfo.length;
				noPaging = false;
			} else {
				//analytic binding should use getTotalSize to return the correct total length
				length = binding.getTotalSize ? binding.getTotalSize() :  binding.getLength();
				var V2ODataModel = sap.ui.require("sap/ui/model/odata/v2/ODataModel");
				if (noPaging && length === -1 && V2ODataModel && (binding.getModel() instanceof V2ODataModel)) {
					length = undefined;
				}
		   }
		}
		if (this._bDataReceiveError) {
			// if error, treat as empty dataset
			return [];
		} else if (V4ODataModel && (binding.getModel() instanceof V4ODataModel) ){
			//for noPaging, Infinity means to prefetch all data
			return noPaging ? binding.getContexts(start, length, Infinity) :
						binding.getContexts(start, length);
		} else {
			return binding.getContexts(start, length);
		}
	};

	return FlattenedDataset;

});
