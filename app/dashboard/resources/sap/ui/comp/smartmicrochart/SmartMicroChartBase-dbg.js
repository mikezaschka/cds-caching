/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
	"sap/ui/core/Element",
	"sap/ui/thirdparty/jquery",
	"sap/ui/comp/library",
	"sap/m/library",
	"sap/ui/comp/providers/ChartProvider",
	"sap/ui/core/format/NumberFormat",
	"sap/ui/core/format/DateFormat",
	"sap/ui/model/BindingMode",
	"sap/ui/model/type/Date",
	"sap/base/Log",
	"sap/ui/core/Control",
	"./SmartMicroChartRenderer",
	'sap/suite/ui/microchart/library'
], function(Element, jQuery, library, MLibrary, ChartProvider, NumberFormat, DateFormat, BindingMode, DateType, Log, Control, SmartMicroChartRenderer, MicroChartLibrary) {
	"use strict";

	var ValueColor = MLibrary.ValueColor;
	var MicroChartColorType = MicroChartLibrary.MicroChartColorType;
	var Size = MLibrary.Size;

	/**
	 * Constructor for a new sap.ui.comp.smartmicrochart.SmartMicroChartBase.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new chart
	 * @class
	 * This is an abstract base class for Smart Micro Charts.
	 * @abstract
	 *
	 * @extends sap.ui.core.Control
	 *
	 * @public
	 * @since 1.60
	 * @alias sap.ui.comp.smartmicrochart.SmartMicroChartBase
	 */

	var SmartMicroChartBase = Control.extend("sap.ui.comp.smartmicrochart.SmartMicroChartBase", /** @lends sap.ui.comp.smartmicrochart.SmartMicroChartBase.prototype */ {
		metadata: {
			"abstract": true,
			library: "sap.ui.comp",
			properties: {

				/**
				 * The OData entity set bound to the smart line micro chart.<br>
				 * This entity set is used to pull data into the micro chart and create its internal representation.<br>
				 * Please note that this property cannot be updated dynamically.
				 */
				entitySet: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Specifies the type of chart. Note that this property is read-only.
				 */
				chartType: {
					type: "string",
					group: "Misc"
				},

				/**
				 * This property can be used to specify a relative path (without '/') to an entity set (not a single entity)
				 * that is used during the binding of the chart.<br>
				 * For example, it can be a navigation property that will be added to the context path.<br>
				 * If not specified, the <code>entitySet</code> property is used instead.
				 */
				chartBindingPath: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Determines if any label is shown or not.
				 */
				showLabel: {
					type: "boolean",
					group: "Appearance",
					defaultValue: true
				},

				/**
				 * The width of the chart. Overrides the width specified in the <code>size</code> property.
				 */
				width: {type: "sap.ui.core.CSSSize", group: "Misc"},

				/**
				 * The height of the chart. Overrides the height specified in the <code>size</code> property.
				 */
				height: {type: "sap.ui.core.CSSSize", group: "Misc"},

				/**
				 * The size of the microchart. If not set, the default size is applied based on the size of the device tile.
				 * Responsive size takes width and height of the parent container where the micro chart is included.
				 *
				 * @since 1.62
				 */
				size: {type: "sap.m.Size", group: "Misc", defaultValue: "Auto"}, // TODO which version

				/**
				 * If this set to true, width and height of the control are determined by the width and height of the container in which the control is placed or by the width and height property.
				 *
				 * @deprecated as of version 1.62, the concept has been discarded.
				 */
				isResponsive: { type: "boolean", group: "Appearance", defaultValue: false } // TODO which version
			},
			defaultAggregation: "_chart",
			aggregations: {
				/**
				 * This private aggregation is used for the internal binding of the {@link sap.suite.ui.microchart.LineMicroChart}
				 */
				_chart: {
					type: "sap.ui.core.Control",
					multiple: false,
					visibility: "hidden"
				}
			},
			associations: {
				/**
				 * If the associated control is provided, its <code>Text</code> property is set to the <code>Title</code> property of the Chart annotation.
				 * The <code>Title</code> property of the DataPoint annotation is ignored.
				 */
				chartTitle: {
					type: "sap.m.Label",
					group: "Misc",
					multiple: false
				},
				/**
				 * If the associated control is provided, its <code>Text</code> property is set to the <code>Description</code> property of the Chart annotation.
				 * The <code>Description</code> property of the DataPoint annotation is ignored.
				 */
				chartDescription: {
					type: "sap.m.Label",
					group: "Misc",
					multiple: false
				},
				/**
				 * If the associated control is provided, its <code>Text</code> property is set to the <code>Unit of Measure</code> property of the Chart annotation.
				 * The <code>Value</code> property of the DataPoint annotation should be annotated with this unit of measurement. It can be either ISOCurrency or Unit from the OData Measures annotations.
				 */
				unitOfMeasure: {
					type: "sap.m.Label",
					group: "Misc",
					multiple: false
				},

				/**
				 * Controls or IDs that label this control. Can be used by screen reader software.
				 * @since 1.60.0
				 */
				ariaLabelledBy: {
					type: "sap.ui.core.Control",
					multiple: true,
					singularName: "ariaLabelledBy"
				}
			},
			events: {

				/**
				 * This event is fired after the control has been initialized.
				 */
				initialize: {}
			}
		},
		renderer: SmartMicroChartRenderer
	});

	SmartMicroChartBase._MINIMIZE = "com.sap.vocabularies.UI.v1.ImprovementDirectionType/Minimize";
	SmartMicroChartBase._MAXIMIZE = "com.sap.vocabularies.UI.v1.ImprovementDirectionType/Maximize";
	SmartMicroChartBase._TARGET = "com.sap.vocabularies.UI.v1.ImprovementDirectionType/Target";
	SmartMicroChartBase._DELTABULLET = "com.sap.vocabularies.UI.v1.VisualizationType/DeltaBulletChart";
	SmartMicroChartBase._BULLET = "com.sap.vocabularies.UI.v1.VisualizationType/BulletChart";

	SmartMicroChartBase._CALENDAR_TERMS_PATTERNS = {
		"com.sap.vocabularies.Common.v1.IsCalendarYear": "yyyy",
			"com.sap.vocabularies.Common.v1.IsCalendarQuarter": "Q",
			"com.sap.vocabularies.Common.v1.IsCalendarMonth": "MM",
			"com.sap.vocabularies.Common.v1.IsCalendarWeek": "ww",
			"com.sap.vocabularies.Common.v1.IsCalendarDate": "yyyyMMdd",
			"com.sap.vocabularies.Common.v1.IsCalendarYearMonth": "yyyyMM"
	};

	SmartMicroChartBase._ASSOCIATIONS = ["chartTitle", "chartDescription", "unitOfMeasure", "freeText"];
	SmartMicroChartBase._ASSOCIATIONS_ANNOTATIONS_MAP = {
		chartDescription: "Description",
		chartTitle: "Title",
		unitOfMeasure: {
			propertyAnnotationPath: "Value",
			propertyAnnotationProperties: ["ISOCurrency", "Unit"]
		},
		freeText: {
			propertyAnnotationPath: "Value",
			propertyAnnotationProperties: ["Label"]
		}
	};

	SmartMicroChartBase._isBulletVizualizationType = function (sType) {
		return (sType === SmartMicroChartBase._BULLET) || (sType === SmartMicroChartBase._DELTABULLET);
	};

	/**
	 * Initializes the OData metadata necessary to create the chart.
	 * @private
	 */
	SmartMicroChartBase.prototype._initializeMetadata = function () {
		if (!this._bIsInitialized) {
			var oModel = this.getModel();
			if (oModel && (oModel.getMetadata().getName() === "sap.ui.model.odata.v2.ODataModel" || oModel.getMetadata().getName() === "sap.ui.model.odata.ODataModel")) {
				if (!this._bMetaModelLoadAttached) {
					oModel.getMetaModel().loaded().then(this._onMetadataInitialized.bind(this));
					this._bMetaModelLoadAttached = true;
				}
			} else if (oModel) {
				// Could be a non-ODataModel or a synchronous ODataModel --> just create the necessary helpers
				this._onMetadataInitialized.call(this);
			}
		}
	};

	/**
	 * Called once the necessary model metadata are available.
	 * @private
	 */
	SmartMicroChartBase.prototype._onMetadataInitialized = function () {
		this._bMetaModelLoadAttached = false; //reset variable
		if (this._bIsInitialized) { //nothing to do if already initialized
			return;
		}

		this._createChartProvider.call(this);
		this._oChartViewMetadata = this._oChartProvider.getChartViewMetadata();
		this._oDataPointMetadata = this._oChartProvider.getChartDataPointMetadata();
		this._bIsInitialized = true; // Indicates the control is initialized and can be used
		this.fireInitialize();

		if (this.getEnableAutoBinding && this.getEnableAutoBinding()) {
			if (this.getChartBindingPath()) {
				this.bindElement(this.getChartBindingPath());
			} else {
				Log.error("The property chartBindingPath needs to be set in order for property enableAutoBinding to be applied.");
			}
		}

		if (this._checkChartMetadata.call(this)) {
			this._aDataPointAnnotations = this._getDataPointAnnotations.call(this); // charts can have multiple dimensions
			this._oDataPointAnnotations = this._aDataPointAnnotations[0]; // but charts has been programmed to handle only one dimension

			if (this._aDataPointAnnotations.every(this._checkDataPointAnnotation.bind(this))) {
				this._createAndBindInnerChart(); //only bind the chart if metadata and annotations are complete
			}

		} else {
			Log.error("Created annotations not valid. Please review the annotations and metadata.");
		}
	};

	/**
	 * Gets array of all DataPoint objects from annotations
	 * @returns {object[]} DataPoint objects
	 * @private
	 */
	SmartMicroChartBase.prototype._getDataPointAnnotations = function () {
		var aAnnotations = [],
			oAnnotation;

		// bullet chart can be created without chart annotation using only the datapoint annotation
		if (this._oChartViewMetadata && this._oChartViewMetadata.measureFields) {
			for (var i = 0; i < this._oChartViewMetadata.measureFields.length; i++) {
				oAnnotation = this._getDataPointAnnotation.call(this, this._oChartViewMetadata.measureFields[i]);
				aAnnotations.push(oAnnotation);
			}
		} else {
			oAnnotation = this._getDataPointAnnotation.call(this);
			aAnnotations.push(oAnnotation);
		}

		return aAnnotations;
	};

	/**
	 * Cleans up instances that were created
	 * @private
	 */
	SmartMicroChartBase.prototype._cleanup = function () {
		if (this._oDateType) { // Destroy the sap.ui.model.type.Date instance which is used to format values
			this._oDateType.destroy();
			this._oDateType = null;
		}
	};

	/**
	 * Creates an instance of the ChartProvider.
	 * @private
	 */
	SmartMicroChartBase.prototype._createChartProvider = function () {
		var oModel, sEntitySetName;
		sEntitySetName = this.getEntitySet();
		oModel = this.getModel();

		// The SmartMicroChart might also need to work for non ODataModel models, so we now create the chart independent of ODataModel.
		if (oModel && sEntitySetName) {
			this._oChartProvider = new ChartProvider({
				entitySet: sEntitySetName,
				model: oModel,
				chartQualifier: this.data("chartQualifier")
			});
		} else {
			Log.error("Property entitySet is not set or no model has been attached to the control.");
		}
	};

	/**
	 * Checks the validity of the Chart annotation.
	 * @private
	 * @returns {boolean} True if the metadata check was successful, otherwise false.
	 */
	SmartMicroChartBase.prototype._checkChartMetadata = function () {
		if (jQuery.isEmptyObject(this._oChartViewMetadata)) {
			if (jQuery.isEmptyObject(this._oDataPointMetadata)) {
				Log.error("DataPoint annotation must be provided if chart annotation is missing.");
				return false;
			}
			return true;
		} else {
			if (!this._oChartViewMetadata.fields || this._oChartViewMetadata.fields.length === 0) {
				Log.error("No fields exist in the metadata.");
				return false;
			}
			if (this._hasMember(this, "_oChartViewMetadata.annotation.ChartType")) {
				return this._checkChartType.call(this);
			} else if (this.getChartType() === "Comparison" || this.getChartType() === "Delta") {
				return true; // SmartComparisonMicroChart and SmartDeltaMicroChart does not have its own value in ChartType/Enum annotation,
							 // thus it can be created without the ChartType annotaion but cannot be created using the SmartMicroChart
			} else {
				Log.error("The Chart annotation is invalid.");
				return false;
			}
		}
	};

	/**
	 * Checks the validity of the ChartType in Chart annotation.
	 * @private
	 *
	 * @returns {boolean} True if the ChartType in Chart annotation is supported, otherwise false.
	 */
	SmartMicroChartBase.prototype._checkChartType = function () {
		var aTypes = this._getSupportedChartTypes();
		for (var i = 0; i < aTypes.length; i++) {
			if (this._oChartViewMetadata.annotation.ChartType.EnumMember === "com.sap.vocabularies.UI.v1.ChartType/" + aTypes[i]) {
				return true;
			}
		}
		Log.error("The ChartType property in the Chart annotation is not part of the list of valid types: \"" + aTypes.toString() + "\".");
		return false;
	};

	/**
	 * Gets the qualifier of DataPoint in Chart annotation
	 * @param {string} [sMeasure] name of the measure
	 * @returns {string} If there are annotations with a valid DataPoint qualifier, the qualifier is
	 *                   returned. If no valid qualifier or no annotations are found, this function
	 *                   returns an empty string.
	 * @private
	 */
	SmartMicroChartBase.prototype._getDataPointQualifier = function (sMeasure) {
		var oMeasureAttribute;

		if (!this._oChartViewMetadata && this._oDataPointMetadata) {
			return this.data("chartQualifier");
		}

		if (!this._hasMember(this, "_oChartViewMetadata.annotation.MeasureAttributes.length") ||
			!this._oChartViewMetadata.annotation.MeasureAttributes.length) {
			return "";
		}

		// when using multiple measures with according measure attributes
		if (sMeasure && this._oChartViewMetadata.measureAttributes && this._oChartViewMetadata.measureAttributes[sMeasure]) {
			return (this._oChartViewMetadata.measureAttributes[sMeasure].dataPoint.match(/\#([^\#]*)$/) || [])[1] || "";
		}

		oMeasureAttribute = this._oChartViewMetadata.annotation.MeasureAttributes[0];
		if (this._hasMember(oMeasureAttribute, "DataPoint.AnnotationPath")) {
			return (oMeasureAttribute.DataPoint.AnnotationPath.match(/\#([^\#]*)$/) || [])[1] || "";
		}
	};

	/**
	 * Gets the DataPoint object from annotation for given measure
	 * @param {string} [sMeasure] name of the measure
	 * @returns {object} DataPoint object
	 * @private
	 */
	SmartMicroChartBase.prototype._getDataPointAnnotation = function (sMeasure) {
		var sQualifier = this._getDataPointQualifier.call(this, sMeasure),
			oAnnotation;

		if (sQualifier) {
			oAnnotation = this._oDataPointMetadata.additionalAnnotations[sQualifier];
		} else {
			oAnnotation = this._oDataPointMetadata.primaryAnnotation;
		}

		return oAnnotation;
	};

	/**
	 * Checks the validity of the DataPoint annotation.
	 * @param {object} oDataPointAnnotations The DataPoint annotations as an object.
	 * @returns {boolean} True if the annotation check was successful, otherwise false.
	 * @private
	 */
	SmartMicroChartBase.prototype._checkDataPointAnnotation = function (oDataPointAnnotations) {
		var sVisualizationType = null;
		if (jQuery.isEmptyObject(oDataPointAnnotations)) {
			Log.error("The DataPoint annotation is empty. Please check it!");
			return false;
		}
		if (this._hasMember(oDataPointAnnotations, "Visualization.EnumMember")) {
			sVisualizationType = oDataPointAnnotations.Visualization.EnumMember;
			if (!SmartMicroChartBase._isBulletVizualizationType(sVisualizationType)) {
				Log.error("The only support visualization types for micro charts are BulletChart and DeltaBulletChart.");
				return false;
			}
		}
		if (jQuery.isEmptyObject(this._oChartViewMetadata) && (sVisualizationType === null)) {
			Log.error("If only DataPoint annotation is provided the VisualizationType is expected to be set.");
			return false;
		}
		// when the Value property does not exist in the DataPoint annotation object, return false
		if (this._hasMember(oDataPointAnnotations, "Value.Path")) {
			if (jQuery.isEmptyObject(oDataPointAnnotations.Criticality)) { //only check criticality calculation if no criticality is given directly
				this._checkCriticalityMetadata(oDataPointAnnotations.CriticalityCalculation);
			}
			return true; //return true even if no criticality was detected
		} else {
			Log.error("The Value property does not exist in the DataPoint annotation. This property is essential for creating the smart chart.");
			return false;
		}
	};

	/**
	 * Checks the validity of the CriticalityCalculation annotation.
	 * @param {object} oCriticality The CriticalityCalculation annotation data.
	 * @returns {boolean} Returns true if the metadata check was successful, false otherwise.
	 * @private
	 */
	SmartMicroChartBase.prototype._checkCriticalityMetadata = function (oCriticality) {
		if (jQuery.isEmptyObject(oCriticality)) {
			Log.warning("The CriticalityCalculation property in DataPoint annotation is not provided.");
			return false;
		}
		if (this._hasMember(oCriticality, "ImprovementDirection.EnumMember")) {
			var sImprovementDirection = oCriticality.ImprovementDirection.EnumMember;

			switch (sImprovementDirection) {
				case SmartMicroChartBase._MINIMIZE:
					return this._checkCriticalityMetadataForMinimize(oCriticality);
				case SmartMicroChartBase._MAXIMIZE:
					return this._checkCriticalityMetadataForMaximize(oCriticality);
				case SmartMicroChartBase._TARGET:
					return this._checkCriticalityMetadataForTarget(oCriticality);
				default:
					Log.warning("The improvement direction in DataPoint annotation must be either Minimize, Maximize or Target.");
			}
		} else {
			Log.warning("The ImprovementDirection property in DataPoint annotation is not provided.");
		}
		return false;
	};

	/**
	 * Checks the validity of the CriticalityCalculation annotation for Minimize improvement direction.
	 * @param {object} oCriticality
	 * @returns {boolean} Returns true if the metadata check was successful, false otherwise.
	 * @private
	 */
	SmartMicroChartBase.prototype._checkCriticalityMetadataForMinimize = function (oCriticality) {
		if (!this._hasMember(oCriticality, "ToleranceRangeHighValue.Path")) {
			Log.warning("The ToleranceRangeHighValue property in DataPoint annotation is missing for Minimize improvement direction.");
			return false;
		}
		if (!this._hasMember(oCriticality, "DeviationRangeHighValue.Path")) {
			Log.warning("The DeviationRangeHighValue property in DataPoint annotation is missing for Minimize improvement direction.");
			return false;
		}
		return true;
	};

	/**
	 * Checks the validity of the CriticalityCalculation annotation for Maximize improvement direction.
	 * @param {object} oCriticality
	 * @returns {boolean} Returns true if the metadata check was successful, false otherwise.
	 * @private
	 */
	SmartMicroChartBase.prototype._checkCriticalityMetadataForMaximize = function (oCriticality) {
		if (!this._hasMember(oCriticality, "ToleranceRangeLowValue.Path")) {
			Log.warning("The ToleranceRangeLowValue property in DataPoint annotation is missing for Minimize improvement direction.");
			return false;
		}
		if (!this._hasMember(oCriticality, "DeviationRangeLowValue.Path")) {
			Log.warning("The DeviationRangeLowValue property in DataPoint annotation is missing for Minimize improvement direction.");
			return false;
		}
		return true;
	};

	/**
	 * Checks the validity of the CriticalityCalculation annotation for Target improvement direction.
	 * @param {object} oCriticality
	 * @returns {boolean} Returns true if the metadata check was successful, false otherwise.
	 * @private
	 */
	SmartMicroChartBase.prototype._checkCriticalityMetadataForTarget = function (oCriticality) {
		if (!this._hasMember(oCriticality, "ToleranceRangeLowValue.Path")) {
			Log.warning("The DeviationRangeLowValue property in DataPoint annotation is missing for Target improvement direction.");
			return false;
		}
		if (!this._hasMember(oCriticality, "ToleranceRangeHighValue.Path")) {
			Log.warning("The ToleranceRangeHighValue property in DataPoint annotation is missing for Target improvement direction.");
			return false;
		}
		if (!this._hasMember(oCriticality, "DeviationRangeLowValue.Path")) {
			Log.warning("The ToleranceRangeLowValue property in DataPoint annotation is missing for Target improvement direction.");
			return false;
		}
		if (!this._hasMember(oCriticality, "DeviationRangeHighValue.Path")) {
			Log.warning("The DeviationRangeHighValue property in DataPoint annotation is missing for Target improvement direction.");
			return false;
		}
		return true;
	};

	/**
	 * Retrieve the color for the respective criticality type.
	 * @param {string} type The full criticality type as defined in the vocabulary or just the EnumMember's name
	 * @return {sap.m.ValueColor} The color that is associated with the criticality type
	 * @private
	 */
	SmartMicroChartBase.prototype._mapCriticalityTypeWithColor = function (type) {
		var sType;

		if (!type) {
			return MicroChartColorType.Neutral;
		} else {
			sType = type.toString();
		}

		sType = (sType.match(/(?:CriticalityType\/)?([^\/]*)$/) || [])[1] || "";
		if (MicroChartColorType.hasOwnProperty(sType)){
			switch (sType) {
				case "Negative":
				case "Error":
				case "1":
					return MicroChartColorType.Error;
				case "Critical":
				case "Warning":
				case "2":
					return MicroChartColorType.Critical;
				case "Good":
				case "Positive":
				case "3":
					return MicroChartColorType.Good;
				case "Sequence1":
					return MicroChartColorType.Sequence1;
				case "Sequence2":
					return MicroChartColorType.Sequence2;
				case "Sequence3":
					return MicroChartColorType.Sequence3;
				case "Sequence4":
					return MicroChartColorType.Sequence4;
				case "Sequence5":
					return MicroChartColorType.Sequence5;
				case "Sequence6":
					return MicroChartColorType.Sequence6;
				case "Sequence7":
					return MicroChartColorType.Sequence7;
				case "Sequence8":
					return MicroChartColorType.Sequence8;
				case "Sequence9":
					return MicroChartColorType.Sequence9;
				case "Sequence10":
					return MicroChartColorType.Sequence10;
				case "Sequence11":
					return MicroChartColorType.Sequence11;
				case "Sequence12":
					return MicroChartColorType.Sequence12;
				default:
					return MicroChartColorType.Neutral;
			}
		} else {
			/**
			* @deprecated As of version 1.135
			*/
			sType = (sType.match(/(?:CriticalityType\/)?([^\/]*)$/) || [])[1] || "";
			switch (sType) {
				case "Negative":
				case "1":
					return ValueColor.Error;
				case "Critical":
				case "2":
					return ValueColor.Critical;
				case "Positive":
				case "3":
					return ValueColor.Good;
				default:
					return ValueColor.Neutral;
			}
		}
	};

	/**
	 * Compile all criticality thresholds and decide for each case whether to use the binding path "Path"
	 * or set a number directly via "Decimal".
	 * @param {Object} oCC The criticality calculation data object from the annotations.
	 * @returns {Object} An object containing the parsed criticality thresholds.
	 * @private
	 */
	SmartMicroChartBase.prototype._getThresholdValues = function (oCC) {
		var oThresholds = {},
			oContext = this.getBindingContext();

		for (var k in oCC) {
			if (oCC.hasOwnProperty(k) && k !== "ImprovementDirection") {
				oThresholds[k] = oCC[k].Path && oContext && oContext.getProperty(oCC[k].Path) || oCC[k].Decimal || 0;
			}
		}
		return oThresholds;
	};

	/**
	 * Determine the circle color for the 'Minimize' value of the ImprovementDirection of the DataPoint annotation
	 * @private
	 * @param {int} iValue The current value to be categorized.
	 * @param {int} iToleranceHigh The ToleranceHighValue from the annotations.
	 * @param {int} iDeviationHigh The DeviationHighValue from the annotations.
	 * @returns {sap.m.ValueColor} The ValueColor associated with the identified criticality
	 */
	SmartMicroChartBase.prototype._getValueColorForMinimize = function (iValue, iToleranceHigh, iDeviationHigh) {
		if (iValue <= iToleranceHigh) {
			return this._mapCriticalityTypeWithColor("Positive");
		} else if (iValue > iToleranceHigh && iValue <= iDeviationHigh) {
			return this._mapCriticalityTypeWithColor("Critical");
		} else if (iValue > iDeviationHigh) {
			return this._mapCriticalityTypeWithColor("Negative");
		}
	};

	/**
	 * Determine and set the bar color for the 'Maximize' value of the ImprovementDirection of the DataPoint annotation
	 * @private
	 * @param {int} iValue The current value to be categorized.
	 * @param {int} iToleranceLow The ToleranceLowValue from the annotations.
	 * @param {int} iDeviationLow The DeviationLowValue from the annotations.
	 * @returns {sap.m.ValueColor} The ValueColor associated with the identified criticality
	 */
	SmartMicroChartBase.prototype._getValueColorForMaximize = function (iValue, iToleranceLow, iDeviationLow) {
		if (iValue >= iToleranceLow) {
			return this._mapCriticalityTypeWithColor("Positive");
		} else if (iValue < iToleranceLow && iValue >= iDeviationLow) {
			return this._mapCriticalityTypeWithColor("Critical");
		} else if (iValue < iDeviationLow) {
			return this._mapCriticalityTypeWithColor("Negative");
		}
	};

	/**
	 * Determine and set the bar color for the 'Maximize' value of the ImprovementDirection of the DataPoint annotation
	 * @private
	 * @param {int} iValue The current value to be categorized.
	 * @param {int} iToleranceLow The ToleranceLowValue from the annotations.
	 * @param {int} iDeviationLow The DeviationLowValue from the annotations.
	 * @param {int} iToleranceHigh The ToleranceHighValue from the annotations.
	 * @param {int} iDeviationHigh The DeviationHighValue from the annotations.
	 * @returns {sap.m.ValueColor} The ValueColor associated with the identified criticality
	 */
	SmartMicroChartBase.prototype._getValueColorForTarget = function (iValue, iToleranceLow, iDeviationLow, iToleranceHigh, iDeviationHigh) {
		if (iValue >= iToleranceLow && iValue <= iToleranceHigh) {
			return this._mapCriticalityTypeWithColor("Positive");
		} else if ((iValue >= iDeviationLow && iValue < iToleranceLow) || (iValue > iToleranceHigh && iValue <= iDeviationHigh)) {
			return this._mapCriticalityTypeWithColor("Critical");
		} else if (iValue < iDeviationLow || iValue > iDeviationHigh) {
			return this._mapCriticalityTypeWithColor("Negative");
		}
	};

	/**
	 * ValueColor formatter function. This function uses the current model value and (optionally) the
	 * directly set criticality to determine the color of the chart it is called on.
	 * @param {float} iValue The current value in the model data.
	 * @param {string} sCriticality The directly set criticality string in the model data.
	 * @returns {sap.m.ValueColor} The corresponding ValueColor for the specified criticality.
	 *                                If no direct criticality is passed, Criticality Calculation is assumed to be required.
	 *                                Defaults to "Neutral" for invalid parameters.
	 * @private
	 */
	SmartMicroChartBase.prototype._getValueColor = function (iValue, sCriticality) {
		var oCC = this._oDataPointAnnotations.CriticalityCalculation,
			oThresholds,
			sColor;

		iValue = parseFloat(iValue) || 0;

		if (typeof sCriticality === "string") { //directly set criticality has priority
			sColor = this._mapCriticalityTypeWithColor(sCriticality);
		} else if (oCC && typeof iValue !== "undefined" && iValue !== null) {
			oThresholds = this._getThresholdValues.call(this, oCC);
			sColor = this._criticalityCalculation(iValue, oCC.ImprovementDirection.EnumMember, oThresholds);
		}
		return sColor || this._mapCriticalityTypeWithColor();
	};

	/**
	 * Uses the current value and criticality thresholds to determine the color of top labels of the chart.
	 * @param {float} fValue The current value in the model data
	 * @param {object} oData A data object to be used for getting criticality threshold values
	 * @param {int} iIndex index of the annotation
	 * @returns {sap.m.ValueColor} The corresponding ValueColor for the specified criticality and ImprovementDirection.
	 * @private
	 */
	SmartMicroChartBase.prototype._getTopLabelColor = function (fValue, oData, iIndex) {
		var oCC = this._aDataPointAnnotations[iIndex].CriticalityCalculation,
			iValue = parseFloat(fValue) || 0,
			oThresholds = {},
			sColor;

		for (var k in oCC) {
			if (oCC.hasOwnProperty(k) && k !== "ImprovementDirection") {
				oThresholds[k] = oData[oCC[k].Path];
			}
		}
		if (oCC && typeof iValue !== "undefined" && iValue !== null) {
			sColor = this._criticalityCalculation(iValue, oCC.ImprovementDirection.EnumMember, oThresholds);
		}
		return sColor;
	};

	/**
	 * Determines and returns the semantic color based on ImprovementDirection and criticality thresholds of the DataPoint annotation
	 * @param {float} value The current value to be categorized
	 * @param {string} improvementDirection The improvementDirection from the annotations
	 * @param {object} thresholds The threshold values for calculation
	 * @returns {sap.m.ValueColor} The ValueColor associated with the identified criticality
	 * @private
	 */
	SmartMicroChartBase.prototype._criticalityCalculation = function (value, improvementDirection, thresholds) {
		var sColor;
		switch (improvementDirection) {
			case SmartMicroChartBase._MINIMIZE:
				sColor = this._getValueColorForMinimize(value, thresholds.ToleranceRangeHighValue, thresholds.DeviationRangeHighValue);
				break;
			case SmartMicroChartBase._MAXIMIZE:
				sColor = this._getValueColorForMaximize(value, thresholds.ToleranceRangeLowValue, thresholds.DeviationRangeLowValue);
				break;
			case SmartMicroChartBase._TARGET:
				sColor = this._getValueColorForTarget(value, thresholds.ToleranceRangeLowValue, thresholds.DeviationRangeLowValue,
					thresholds.ToleranceRangeHighValue, thresholds.DeviationRangeHighValue);
				break;
			default:
				Log.warning("The improvement direction in DataPoint annotation must be either Minimize, Maximize or Target.");
		}
		return sColor;
	};

	/**
	 * Get the annotation for a specified association.
	 * @param {string} association The association the annotations should be retrieved for.
	 *                             This association has to be mapped in _ASSOC_ANNOT_MAP.
	 * @returns {object} Returns an object containing the annotation for the specified association.
	 *                   If invalid data is encountered, an empty object is returned.
	 * @private
	 */
	SmartMicroChartBase.prototype._getAnnotation = function (association) {
		var oAnnotation = SmartMicroChartBase._ASSOCIATIONS_ANNOTATIONS_MAP[association];
		if (!oAnnotation) {
			Log.warning("No annotation connected to association \"" + association + "\".");
			return {};
		}

		if (!jQuery.isEmptyObject(this._oChartViewMetadata) && typeof oAnnotation === "string") {
			return this._oChartViewMetadata.annotation[oAnnotation];
		}
		if (!jQuery.isEmptyObject(this._oDataPointAnnotations) &&
			this._hasMember(oAnnotation, "propertyAnnotationPath") &&
			this._hasMember(oAnnotation, "propertyAnnotationProperties")) {
			var oPropertyAnnotation;
			if (this._hasMember(this._oDataPointAnnotations, oAnnotation.propertyAnnotationPath + ".Path")) {
				oPropertyAnnotation = this._getPropertyAnnotation.call(this, this._oDataPointAnnotations[oAnnotation.propertyAnnotationPath].Path);
			}
			if (oPropertyAnnotation) {
				return this._getValueFromPropertyAnnotation(oPropertyAnnotation, oAnnotation.propertyAnnotationProperties);
			}
		}
		return {};
	};

	/**
	 * Retrieve the first value in the property annotation of a previously determined annotation
	 * term (e.g. ISOCurrency/Label/Unit).
	 * @param {object} oPropertyAnnotation The property annotation object with all annotation terms.
	 * @param {string[]} aProperties An array of all possible terms.
	 * @returns {object} Returns an object containing the annotation binding information (or a String),
	 *                   or an empty object if oPropertyAnnotation does not contain any terms.
	 * @private
	 */
	SmartMicroChartBase.prototype._getValueFromPropertyAnnotation = function (oPropertyAnnotation, aProperties) {
		for (var sProp in oPropertyAnnotation) {
			for (var i = 0; i < aProperties.length; i++) {
				if (sProp.indexOf(aProperties[i]) > -1) {
					return oPropertyAnnotation[sProp];
				}
			}
		}
		return {};
	};

	/**
	 * Update a specified association on a control bound to this function's context using annotation
	 * data from Chart or DataPoint annotations. This includes re-binding or directly setting the
	 * associated control's text property.
	 * @param {string} associationName The name of the association to be updated.
	 * @param {object} data A data object to be used for setting association texts directly.
	 * @private
	 */
	SmartMicroChartBase.prototype._updateAssociation = function (associationName, data) {
		var oAssociation, oAnnotation;

		if (this.getMetadata().hasAssociation(associationName)) {
			oAssociation = Element.getElementById(this.getAssociation(associationName));
			if (oAssociation && oAssociation.getMetadata().hasProperty("text")) {
				oAnnotation = this._getAnnotation.call(this, associationName);
				this._setAssociationText(oAssociation, oAnnotation, data);
			}
		}
	};

	/**
	 * Update all of the control's special associations.
	 * @param {object} oBinding The binding info
	 * @private
	 */
	SmartMicroChartBase.prototype._updateAssociations = function (oBinding) {
		var oContext = oBinding && oBinding.getContexts(0, 1)[0],
			oData = oContext && oContext.getObject();

		var n = SmartMicroChartBase._ASSOCIATIONS.length;
		for (var i = 0; i < n; i++) {
			this._updateAssociation.call(this, SmartMicroChartBase._ASSOCIATIONS[i], oData);
		}
	};

	/**
	 * Updates all chart labels based on the data of the minimum and maximum values of the bound points.
	 * @param {object[]} oBinding The binding info of the points
	 * @private
	 */
	SmartMicroChartBase.prototype.updateChartLabels = function (oBinding) {
		var oMinX = {value: Infinity},
			oMaxX = {value: -Infinity},
			oMinY = {value: Infinity},
			oMaxY = {value: -Infinity},
			iCurrentX,
			iCurrentY,
			sXName,
			sYName,
			aContexts;

		aContexts = oBinding.getContexts();

		aContexts.forEach(function (oContext) {
			for (var i = 0; i < this._oChartViewMetadata.dimensionFields.length; i++) {
				sXName = this._oChartViewMetadata.dimensionFields[i];
				iCurrentX = oContext.getProperty(sXName);
				sYName = this._oChartViewMetadata.measureFields[i];
				iCurrentY = oContext.getProperty(sYName);

				oMinX = (iCurrentX < oMinX.value) ? {context: oContext, value: iCurrentX, index: i} : oMinX;
				oMaxX = (iCurrentX > oMaxX.value) ? {context: oContext, value: iCurrentX, index: i} : oMaxX;
				oMinY = (iCurrentY < oMinY.value) ? {context: oContext, value: iCurrentY, index: i} : oMinY;
				oMaxY = (iCurrentY > oMaxY.value) ? {context: oContext, value: iCurrentY, index: i} : oMaxY;
			}
		}, this);

		if (oMinY.context && oMinX.context && oMaxY.context && oMaxX.context) {
			this._updateTopLabel.call(this, this._getLabelsMap()["leftTop"], oMinY.context.getObject(), oMinY.index);
			this._updateBottomLabel.call(this, this._getLabelsMap()["leftBottom"], oMinX.context.getObject(), oMinX.index);
			this._updateTopLabel.call(this, this._getLabelsMap()["rightTop"], oMaxY.context.getObject(), oMaxY.index);
			this._updateBottomLabel.call(this, this._getLabelsMap()["rightBottom"], oMaxX.context.getObject(), oMaxX.index);
		}
	};

	/**
	 * Update the top labels of chart.
	 * @param {string} sName The name of the aggregation or property to be updated.
	 * @param {object} oData A data object to be used for setting label texts directly.
	 * @param {int} iIndex index of the annotation
	 * @private
	 */
	SmartMicroChartBase.prototype._updateTopLabel = function (sName, oData, iIndex) {
		var iValue = oData[this._aDataPointAnnotations[iIndex].Value.Path],
			sColor = this._getTopLabelColor.call(this, iValue, oData, iIndex),
			oFormatter = this._getLabelNumberFormatter.call(this, this._aDataPointAnnotations[iIndex].Value.Path),
			sFormattedValue;

		sFormattedValue = oFormatter.format(iValue);

		this._updateLabel(sName, {
			text: sFormattedValue,
			color: sColor
		});
	};

	/**
	 * Update the bottom labels of chart.
	 * @param {string} sName The name of the aggregation or property to be updated
	 * @param {object} oData A data object to be used for setting label texts directly
	 * @param {int} iIndex index of the annotation
	 * @private
	 */
	SmartMicroChartBase.prototype._updateBottomLabel = function (sName, oData, iIndex) {
		var oAnnotation, oDimensionAnnotation, sValue, sFormattedValue;

		oAnnotation = this._oChartViewMetadata.dimensionFields[iIndex];
		if (oAnnotation) {
			sValue = oData[oAnnotation];

			oDimensionAnnotation = this._getPropertyAnnotation.call(this, this._oChartViewMetadata.dimensionFields[iIndex]);
			if (oDimensionAnnotation.hasOwnProperty("sap:text") || oDimensionAnnotation.hasOwnProperty("com.sap.vocabularies.Common.v1.Text")) {
				var sPropertyName = oDimensionAnnotation["sap:text"] || oDimensionAnnotation["com.sap.vocabularies.Common.v1.Text"].Path;
				sFormattedValue = oData[sPropertyName];
			} else {
				sFormattedValue = this._formatBottomLabel.call(this, sValue, oDimensionAnnotation);
			}

			if (sFormattedValue) {
				this._updateLabel(sName, {
					text: sFormattedValue
				});
			}
		}
	};

	/**
	 * Format values for bottom label.
	 * @param {string|number|Date} value The value needs to be formatted
	 * @param {object} annotation The annotation of a property
	 * @returns {string} The formatted string or null
	 * @private
	 */
	SmartMicroChartBase.prototype._formatBottomLabel = function (value, annotation) {
		var sPattern = this._getSemanticsPattern.call(this, annotation);
		if (sPattern) { // If semantic pattern exists then use it to format value
			return this._formatSemanticsValue.call(this, value, sPattern);
		}

		sPattern = this._getCalendarPattern.call(this, annotation);
		if (sPattern) { // If Calendar annotation exists then use it to format value
			return this._formatSemanticsValue.call(this, value, sPattern);
		}

		// If no pattern is available then format the value according to its type
		return this._formatDateAndNumberValue.call(this, value);
	};

	/**
	 * Formats the given value using the provided sap:semantics pattern.
	 * @param {string} value The value which needs to be formatted
	 * @param {string} pattern The pattern which is used to parse the value
	 * @returns {string} The formatted string or null
	 * @private
	 */
	SmartMicroChartBase.prototype._formatSemanticsValue = function (value, pattern) {
		if (pattern) {
			if (!this._oDateType) {
				this._oDateType = new DateType({
					style: "short",
					source: {
						pattern: pattern
					}
				});
			}
			return this._oDateType.formatValue(value, "string");
		}
		return null;
	};

	/**
	 * Format values when they are date type or number type.
	 * @param {(string|number|Date)} value The value which needs to be formatted
	 * @returns {string} The formatted string or null
	 * @private
	 */
	SmartMicroChartBase.prototype._formatDateAndNumberValue = function (value) {
		if (value instanceof Date) {
			return this._getLabelDateFormatter.call(this).format(value);
		} else if (!isNaN(value)) {
			return this._getLabelNumberFormatter.call(this, this._oChartViewMetadata.dimensionFields[0]).format(value);
		} else {
			return null;
		}
	};

	/**
	 * Checks if the annotation of the given property contains sap:semantics, and returns the semantic pattern to parse the value
	 * @param {object} annotation The annotation of a property
	 * @returns {string} The pattern which is used for parsing the string or null
	 * @private
	 */
	SmartMicroChartBase.prototype._getSemanticsPattern = function (annotation) {
		if (annotation.hasOwnProperty("sap:semantics")) {
			switch (annotation["sap:semantics"]) {
				case "yearmonthday":
					return "yyyyMMdd";
				case "yearmonth":
					return "yyyyMM";
				case "year":
					return "yyyy";
				default:
					return null;
			}
		}
		return null;
	};

	/**
	 * Checks if the annotation of the given property contains calendar annotation terms, and returns the semantic pattern to parse the value.
	 * @param {object} annotation The annotation of a property
	 * @returns {string} The pattern which is used for parsing the string or null
	 * @private
	 */
	SmartMicroChartBase.prototype._getCalendarPattern = function (annotation) {
		for (var sCalendarTerm in SmartMicroChartBase._CALENDAR_TERMS_PATTERNS) {
			if (annotation.hasOwnProperty(sCalendarTerm)) {
				return SmartMicroChartBase._CALENDAR_TERMS_PATTERNS[sCalendarTerm];
			}
		}
		return null;
	};

	/**
	 * Creates the number formatter instance with annotation data.
	 * @param {string} path The annotation path.
	 * @returns {sap.ui.core.format.NumberFormat} Formatter to display numbers uniformly.
	 * @private
	 */
	SmartMicroChartBase.prototype._getLabelNumberFormatter = function (path) {
		var iPrecision = this._getPropertyAnnotation.call(this, path).precision || null;

		return NumberFormat.getFloatInstance({
			style: "short",
			showScale: true,
			precision: iPrecision
		});
	};

	/**
	 * Creates a date formatter instance.
	 * @returns {sap.ui.core.format.DateFormat} Formatter to display dates uniformly.
	 * @private
	 */
	SmartMicroChartBase.prototype._getLabelDateFormatter = function () {
		return DateFormat.getInstance({
			style: "short"
		});
	};

	/**
	 * Bind or set directly the association's text property depending on the given oAnnotation object.
	 * @param {sap.ui.core.Control} association The associated control.
	 * @param {object} annotation The annotation used to set the new binding path or text property.
	 * @param {object} data A data object to be used for setting association texts directly.
	 * @private
	 */
	SmartMicroChartBase.prototype._setAssociationText = function (association, annotation, data) {
		if (!annotation) {
			return;
		}

		if (annotation.Path && data) {
			association.setProperty("text", data[annotation.Path], false);
		} else if (annotation.Path) {
			association.bindProperty("text", {
				path: annotation.Path,
				mode: BindingMode.OneWay
			});
			association.invalidate();
		} else if (annotation.String) {
			if (annotation.String.indexOf("{") === 0) {
				var aParts = annotation.String.split(">");
				association.bindProperty("text", {
					path: aParts[1].substr(0, aParts[1].length - 1),
					model: aParts[0].substr(1),
					mode: BindingMode.OneWay
				});
				association.invalidate();
			} else {
				association.setProperty("text", annotation.String, false);
			}
		}
	};

	/**
	 * Get all annotations for the entityType property
	 * @param {string} propertyName The name of the property in the entity type the annotations are to be retrieved for.
	 * @returns {Object} oPropertyAnnotation The annotations of the specified property
	 * @private
	 */
	SmartMicroChartBase.prototype._getPropertyAnnotation = function (propertyName) {
		var oMetaModel, sEntityTypeName, oEntityType, oPropertyAnnotation;
		oMetaModel = this.getModel().getMetaModel();
		sEntityTypeName = this._oChartProvider._oMetadataAnalyser.getEntityTypeNameFromEntitySetName(this.getEntitySet()); //get entity type from entity set name
		oEntityType = oMetaModel.getODataEntityType(sEntityTypeName); //use entity type's name to get detailed information about entity type
		oPropertyAnnotation = oMetaModel.getODataProperty(oEntityType, propertyName); //get annotation for property from entity type object
		return oPropertyAnnotation;
	};

	/**
	 * This method checks whether obj contains members specified by the path following the pattern "a.b.c".
	 *
	 * @param {object} obj The object to be tested for the members.
	 * @param {string} path The string containing the path obj is to be tested for.
	 * @returns {boolean} True if the given object has the members described by the given path, otherwise false.
	 * @private
	 */
	SmartMicroChartBase.prototype._hasMember = function (obj, path) {
		var sDelim = ".", aParts = path.split(sDelim), sMember = aParts.shift();
		return !!obj && ((aParts.length > 0) ? this._hasMember(obj[sMember], aParts.join(sDelim)) : obj.hasOwnProperty(sMember));
	};

	/**
	 * Gets the accessibility information from the underlying (inner) MicroChart instance.
	 *
	 * @returns {Object} The accessibility information object of the underlying MicroChart instance
	 * @private
	 */
	SmartMicroChartBase.prototype.getAccessibilityInfo = function () {
		var oAccessibilityInformation = {};
		var oInnerChart = this.getAggregation("_chart");

		if (oInnerChart && oInnerChart.getAccessibilityInfo) {
			oAccessibilityInformation = oInnerChart.getAccessibilityInfo();
		}

		return oAccessibilityInformation;
	};

	/**
	 * Formats the given dimension value.
	 * @param {object} fValue The unformatted value for the dimension
	 * @returns {float} The time stamp value or zero
	 * @private
	 */
	SmartMicroChartBase.prototype._formatDimension = function (fValue) {
		if (typeof fValue === "string") {
			var oAnnotation = this._getPropertyAnnotation.call(this, this._oChartViewMetadata.dimensionFields[0]),
				sPattern = this._getSemanticsPattern.call(this, oAnnotation);
			if (sPattern) {
				fValue = DateFormat.getInstance({pattern: sPattern}).parse(fValue);
			}
		}
		if (fValue instanceof Date) {
			return parseFloat(fValue.getTime());
		} else if (!isNaN(fValue)) {
			return parseFloat(fValue);
		} else {
			this.getAggregation("_chart").enableXIndexing(true);
			return 0;
		}
	};

	SmartMicroChartBase.prototype.exit = function () {
		this._cleanup.call(this); // Clean up the instances which were created in SmartMicroChartBase
	};

	SmartMicroChartBase.prototype.setEntitySet = function (sEntitySetName) {
		if (this.getProperty("entitySet") !== sEntitySetName) {
			this.setProperty("entitySet", sEntitySetName, true);
			this._initializeMetadata.call(this);
		}
		return this;
	};

	SmartMicroChartBase.prototype.addAriaLabelledBy = function (vAriaLabelledBy) {
		this.addAssociation("ariaLabelledBy", vAriaLabelledBy, true);
		this.getAggregation("_chart").addAriaLabelledBy(vAriaLabelledBy);
		return this;
	};

	SmartMicroChartBase.prototype.removeAriaLabelledBy = function (vAriaLabelledBy) {
		this.removeAssociation("ariaLabelledBy", vAriaLabelledBy, true);
		this.getAggregation("_chart").removeAriaLabelledBy(vAriaLabelledBy);
		return this;
	};

	SmartMicroChartBase.prototype.removeAllAriaLabelledBy = function () {
		this.removeAllAssociation("ariaLabelledBy", true);
		this.getAggregation("_chart").removeAllAriaLabelledBy();
		return this;
	};

	/**
	 * @returns {sap.ui.comp.smartmicrochart} Reference to 'this' in order to allow method chaining.
	 * @private
	 */
	SmartMicroChartBase.prototype.setChartType = function () {
		return this;
	};

	/**
	 * Calls propagateProperties of Control and initializes the metadata afterwards.
	 * @private
	 */
	SmartMicroChartBase.prototype.propagateProperties = function () {
		if (Control.prototype.propagateProperties) {
			Control.prototype.propagateProperties.apply(this, arguments);
		}
		this._initializeMetadata.call(this);
	};

	/**
	 * Determines the chart's binding path used directly in the bindings for data points and thresholds.
	 * @returns {string} If the chartBindingPath property is set, it is returned. If no chartBindingPath is set,
	 *                   the path is constructed absolute from the entitySet property.
	 * @private
	 */
	SmartMicroChartBase.prototype._getBindingPath = function () {
		if (this.getChartBindingPath()) {
			return this.getChartBindingPath();
		} else if (this.getEntitySet()) {
			return "/" + this.getEntitySet();
		} else {
			return "";
		}
	};

	/**
	 * Gets the supported types of ChartType in Chart annotation.
	 * @returns {array} Chart types
	 * @private
	 */
	SmartMicroChartBase.prototype._getSupportedChartTypes = function() {
		return this._CHART_TYPE;
	};

	SmartMicroChartBase.prototype.setSize = function (sSize) {
		if (this.getSize() !== sSize) {
			this.setProperty("size", sSize);
		}
		return this;
	};

	SmartMicroChartBase.prototype.setAssociation = function(sAssociationName, sId, bSuppressInvalidate) {
		if (Control.prototype.setAssociation) {
			Control.prototype.setAssociation.apply(this, arguments);
		}
		this._updateAssociation.call(this, sAssociationName);
		return this;
	};

	/**
		 * Checkes whether current size is sap.m.Size.Responsive

		* @return {boolean} True if Responsive, false otherwise
		* @private
	*/
	SmartMicroChartBase.prototype._isResponsive = function () {
		return this.getSize() === Size.Responsive;
	};

	return SmartMicroChartBase;
});
