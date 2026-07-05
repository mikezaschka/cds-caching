/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
/*
 * helper for paging mode.
 */
sap.ui.define(['sap/ui/model/Sorter', "sap/ui/thirdparty/jquery"], function(Sorter, jQuery) {
	"use strict";

    var PAGE_SIZE = 500;

    function isRequestedDataAvailable(oBinding, start, length){

          var aContexts = oBinding.getContexts(start, length), bNoContexts;

		if (aContexts.length === 0 || aContexts.dataRequested) {
			bNoContexts = true;
		} else {
			bNoContexts = aContexts.some(function(oContext) {
						return oContext === undefined;
			});
		}

		return !bNoContexts;
	}

	var PagingController = function(oChart){

		this._mMeasureRange = {};
		this._iRenderedPageNo = -1;
		//if the size is small, paging will not be turned on even the paging is on
		this._bUnderPaging = false;
		this._iMaxPageNo = -1;
		this._iRemainingRecords = -1;
		this._iOffset = null;
		this._oChart = oChart;
		this._bInitialized = false;
		this._aPagingSorters = null;
		this._bMinMaxQueried = false;
		this._oColorTracker = oChart._oColorTracker;

        var oDataset =  this._oChart._getDataset();
        if (oDataset){
           oDataset.setRange(0, PAGE_SIZE * 2);
        }

         var oVizframe = this._oChart._getVizFrame();
         oVizframe.attachEvent("_scroll", PagingController.prototype._scrollHandler.bind(this));

	};

    PagingController.prototype.bindingChanged = function(){
        if (!this._bInitialized || !this._bMinMaxQueried){
            this.init(true);
        } else if (this.isUnderPaging()){
	        this.paging(this._scrollRatio);
	    }
    };

    PagingController.prototype.reset = function(){

        this._bInitialized = false;
        this._iRenderedPageNo = 0;
        this._mMeasureRange = {};
        this._bMinMaxQueried = false;
		this._oColorTracker.clear();

        var oBinding =  this._oChart.getBinding("data");
		var oDataset =  this._oChart._getDataset();
		if (!oDataset || !oBinding) {
			return;
		}

		var aFeeds = this._oChart._prepareFeeds();
	    aFeeds._order = aFeeds._order.filter(function(sFeed) {
			return sFeed !== "MND" && this._oChart.getDimensions().map(function(oValue){return oValue.getName();}).indexOf(sFeed) > -1;
		}.bind(this));

        this._aPagingSorters = null;


		this._oChart._getVizFrame()._runtimeScales(this._oColorTracker.get(), true);
        this._oChart._getVizFrame()._readyToRender(false);

        var iLength;
		if (this._oChart.getBindingInfo("data").length) {
			iLength = Math.min(PAGE_SIZE * 2, this._oChart.getBindingInfo("data").length);
		} else {
			iLength = PAGE_SIZE * 2;
		}

		oDataset.setRange(0, iLength);

		var V4ODataModel = sap.ui.require("sap/ui/model/odata/v4/ODataModel");
        if (aFeeds._order.length) {
            var aSorters = this._oChart._aFeeds._order.map(function(sProperty) {
                return new Sorter(sProperty);
            });
            //oBinding.resetData();
            oBinding.sort(aSorters);
            this._aPagingSorters = aSorters;
        } else if (V4ODataModel && (oBinding.getModel() instanceof V4ODataModel)) {
			oBinding.sort([]);
		}
		oDataset.setPagingOption({
            bEnabled: false
		});
    };

    PagingController.prototype.getPagingSorters = function(){
         return this._aPagingSorters;
    };

    PagingController.prototype.isUnderPaging = function(){

          return !!this._bUnderPaging;
    };

	PagingController.prototype.init = function(bNeedQueryMinMax){

        this._bInitialized = true;
        this._bUnderPaging = false;

        var oVizframe = this._oChart._getVizFrame();

        var oDataset = oVizframe.getDataset();
		var oBinding = oDataset.getBinding("data");
		if (!oBinding) {
			return;
		}

		var iTotalSize = oBinding.isA("sap.ui.model.analytics.AnalyticalBinding") ? oBinding.getTotalSize() : oBinding.getLength();

		var oPagingOption;
		if (iTotalSize >= 0) {
			if (this._oChart.getBindingInfo("data").length) {
				this._iTotalSize = Math.min(this._oChart.getBindingInfo("data").length, iTotalSize);
			} else {
				this._iTotalSize = iTotalSize;
			}

			if (this._iTotalSize > PAGE_SIZE * 2) {
				this._bUnderPaging = true;
				this._iMaxPageNo = Math.floor(this._iTotalSize / PAGE_SIZE) - 1;
				this._iRemainingRecords = this._iTotalSize % PAGE_SIZE;
				this._iOffset = null;
				this._iRenderedPageNo = 0;
				var dataRatio = PAGE_SIZE / this._iTotalSize;
				oPagingOption = {
					bEnabled: true,
					sMode: "reset",
					thumbRatio: dataRatio
				};

				oDataset.setRange(0 , PAGE_SIZE);
				if (bNeedQueryMinMax) {
					this._bMinMaxQueried = true;
					var measureRangePromise = this._oChart._oMeasureRangePromise || this._queryMinMax(this._oChart, oBinding);
					measureRangePromise.then(function(mMeasureRange){
						this._mMeasureRange = mMeasureRange;
						this._oChart._invalidateBy({
							source: this._oChart,
							keys: {
								vizFrame: true
							}
						});
						this._oChart.setBusy(false);
						oVizframe._readyToRender(isRequestedDataAvailable(oBinding , 0, PAGE_SIZE));
					}.bind(this));
				} else {
					oVizframe._readyToRender(isRequestedDataAvailable(oBinding , 0, PAGE_SIZE));
				}
				this._bUnderPaging = true;
			} else {
				this._mMeasureRange = {};
				oPagingOption = {
					bEnabled: false
				};

				this._bUnderPaging = false;
				oDataset.setRange(0 , this._iTotalSize);
				oVizframe._readyToRender(isRequestedDataAvailable(oBinding , 0, this._iTotalSize));
			}

			oDataset.setPagingOption(oPagingOption);
		}
	};

	PagingController.prototype.paging = function(ratio){
		var iCurrentPageNo = Math.floor(this._iTotalSize * ratio / PAGE_SIZE);
		var oVizFrame = this._oChart._getVizFrame();
		//we merge last two pages in case last page does not reach pageSize
		iCurrentPageNo = Math.min(iCurrentPageNo, this._iMaxPageNo);
		this._iOffset = null;

		var iStartIndex = Math.max((iCurrentPageNo - 1) * PAGE_SIZE, 0);
		var iLength, domain;

		if (iCurrentPageNo === 0) {
			iLength = PAGE_SIZE;
			domain = PAGE_SIZE;
		} else if (iCurrentPageNo === this._iMaxPageNo){
			iLength = PAGE_SIZE * 2 + this._iRemainingRecords;
			domain = PAGE_SIZE + this._iRemainingRecords;
		} else {
			iLength = PAGE_SIZE * 2;
			domain =  PAGE_SIZE;
		}

		this._iOffset = (this._iTotalSize * ratio - iCurrentPageNo * PAGE_SIZE) / domain;

		if (this._iRenderedPageNo === iCurrentPageNo) {
			//current page is rendered
			var translate = {
				plot: {
					transform: {
						translate: {
							translateByPage: {
								context: this._middleCtx,
								offset: this._iOffset
							}
						}
					}
				}
			};
			oVizFrame._states(translate);
		} else {
			if (this._pagingTimer) {
				clearTimeout(this._pagingTimer);
			}

			var oDataset = oVizFrame.getDataset();
			var oBinding = oDataset.getBinding("data");

			this._pagingTimer = setTimeout(function() {
				oDataset.setRange(iStartIndex, iLength);
				oDataset.setPagingOption({
						bEnabled: true,
						sMode: "update",
						thumbRatio: null
				});

				var isDataAvailable = isRequestedDataAvailable(oBinding , iStartIndex, iLength);
				if (isDataAvailable) {
					//analytical binding has these data in local
					//current page is not rendered
					this._iRenderedPageNo = iCurrentPageNo;
					oDataset.invalidate();
					oVizFrame._readyToRender(true);
					oVizFrame.invalidate();
					this._oColorTracker.add(oVizFrame._runtimeScales());
					oVizFrame._runtimeScales(this._oColorTracker.get(), true);
				} else {
					oVizFrame._readyToRender(false);
				}
			}.bind(this), 50);

			this._sLoadingTimer = this._sLoadingTimer || setTimeout(function() {
				this._oChart._showLoading(true);
			}.bind(this), 200);
		}
	};

    /**
     ** move chart plot to the middle of the page since we draw 2 pages at one time, after rendering complete
     ** we have to move the plot to the middle of the two pages.
    **/
	PagingController.prototype.vizFrameRenderCompleted = function() {

        if (this._sLoadingTimer) {
			clearTimeout(this._sLoadingTimer);
            this._sLoadingTimer = null;
		}

		this._oChart._showLoading(false);

		if (!this._bUnderPaging){
			return;
		}
        var oVizFrame = this._oChart._getVizFrame();
		var oDataset = oVizFrame.getDataset();
		var oBinding = oDataset.getBinding("data");
		var iRenderedPageNo = this._iRenderedPageNo;
		if (iRenderedPageNo !==  0) {
			var iMidRecordNo = iRenderedPageNo * PAGE_SIZE - 1;
			this._middleCtx = oBinding.getContexts(iMidRecordNo, 1)[0].getObject();
		} else {
			this._middleCtx = null;
		}

		if (this._middleCtx || this._iOffset) {
			var translate = {
					plot: {
						transform: {
							translate: {
								translateByPage: {
									context: this._middleCtx,
									offset: this._iOffset
								}
							}
						}
					}
				};
			oVizFrame._states(translate);
		}
	};

	PagingController.prototype._scrollHandler = function(oEvent){
        if (this._oChart._isEnablePaging()){
            this._scrollRatio = oEvent.getParameters().position;
		    this.paging(this._scrollRatio);
        }

    };

	// Request for the min/max at current aggregation level for all visible measures
	PagingController.prototype._queryMinMax = function(oChart, oBinding) {
		var aDims = oChart._getRequiredDimensions().map(function(oDim) {
				return oDim.getName();
			}),
			aMsrs = oChart._getRequiredMeasures().map(function(oMsr) {
				return oMsr.getName();
			});

		var oResult = aMsrs.reduce(function(oResult, sMsr) {
			oResult[sMsr] = {min: {}, max: {}};
			return oResult;
		}, {});

		return new Promise(function(resolve, reject){
			function checkComplete() {
				var bAllComplete = aMsrs.every(function(sMsr) {
					return oResult[sMsr].min.requested && oResult[sMsr].max.requested;
				});
				if (bAllComplete) {
					resolve(oResult);
				}
			}
			function onsuccess(sMsr, sKey, oData) {
				oResult[sMsr][sKey].requested = true;
				oResult[sMsr][sKey].value = parseFloat(oData && oData.results[0][sMsr]);
				checkComplete();
			}

			function onerror(sMsr, sKey, oData) {
				oResult[sMsr][sKey].requested = true;
				oResult[sMsr][sKey].error = oData;
				checkComplete();
			}
			var aQueries = aMsrs.reduce(function(aQueries, sMsr) {
				return aQueries.concat({
					urlParameters: {
						"$select": aDims.concat(sMsr).join(","),
						"$top": 1,
						"$orderby": sMsr + " asc"
					},
					success: onsuccess.bind(null, sMsr, "min"),
					error: onerror.bind(null, sMsr, "min")
				}, {
					urlParameters: {
						"$select": aDims.concat(sMsr).join(","),
						"$top": 1,
						"$orderby": sMsr + " desc"
					},
					success: onsuccess.bind(null, sMsr, "max"),
					error: onerror.bind(null, sMsr, "max")
				});
			}, []);

			var sPath = oBinding.getPath(),
				oModel = oBinding.getModel();

			aQueries.forEach(function(oQuery) {
				oModel.read(sPath, oQuery);
			});
		}).then(function(oQueryResult){
			var mMeasureRange = {};
			jQuery.each(oQueryResult, function(sMsrId, oResult) {
				mMeasureRange[sMsrId] = {
					min: oResult.min.value,
					max: oResult.max.value
				};
			});
			return mMeasureRange;
		});
	};

    PagingController.prototype.getMeasureRange = function(){
        return this._mMeasureRange;
    };

	return PagingController;
});
