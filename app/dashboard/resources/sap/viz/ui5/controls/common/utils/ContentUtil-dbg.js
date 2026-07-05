/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
// merge the content setting of toolTop and popover
sap.ui.define(function() {
	"use strict";

	var ContentUtil = {};
	var MAX_MEASURE_LABLE_LEN = 15;
	var MAX_MEASURE_VALUE_LEN = 12;

	ContentUtil.setContent = function(actionName, data) {

		var values = data.val;
		var isLongMode = false;
		var name, dimensionValue, items = [], results = {}, dims = "", displayValue = '';
		var measureValue = '';

		var getNoValueLabel = function(){
			return sap.viz.extapi.env.Language.getResourceString("IDS_ISNOVALUE");
		};

		for (var i = 0; i < values.length; i++) {
			name = values[i].dataName || values[i].name;
			if (values[i].type && values[i].type.toLowerCase() === 'dimension') {
				dimensionValue = values[i].value;
				if (data.isTimeSeries && values.hasOwnProperty("timeDimensions") &&
						values.timeDimensions.indexOf(i) > -1){
						//Time Dimension
						var fiscalLabels = (values[i].timeAxis && values[i].timeAxis.getFiscalUnitLabels &&
							values[i].timeAxis.getFiscalUnitLabels());
						if (fiscalLabels && fiscalLabels.length > 0) {
							// After applying a custom text formatter, if the 'value' object contains the key 'value.d'
							// then set the display value to the corresponding 'value.d' property from the 'values' array at index 'i'.
							if (values && values[i] && values[i]['value.d']) {
								items.push({
									name: name,
									value: values[i]['value.d'],
									type: 'dimension'
								});
								if (actionName === 'popover') {
									displayValue = values[i]['value.d'];
								}
							} else {
								items.push({
									name: fiscalLabels[0],
									value: dimensionValue.fiscalyear,
									type: 'dimension'
								});

								if (fiscalLabels.length > 1) {
									items.push({
										name: fiscalLabels[1],
										value: dimensionValue.fiscalperiod,
										type: 'dimension'
									});
								}

								if (actionName === 'popover') {
									displayValue = dimensionValue.fiscalperiod;
									if (dimensionValue.fiscalyear) {
										if (!displayValue || displayValue.length < dimensionValue.fiscalyear.length) {
											displayValue = dimensionValue.fiscalyear;
										}
									}
								}
							}
						} else {
							if (actionName === 'toolTip') {
								if (dimensionValue.time) {
									var valueTemp = '';
									if (dimensionValue.day) {
										valueTemp = dimensionValue.time + " " + dimensionValue.day;
									} else {
										valueTemp = dimensionValue.time;
									}
									items.push({
										name : name,
										value : valueTemp,
										type : 'dimension'
									});
								}
								if (dimensionValue.day && !dimensionValue.time) {
									items.push({
										name : name,
										value : dimensionValue.day,
										type : 'dimension'
									});
								}
							} else if (actionName === 'popover') {
								if (dimensionValue.time) {
									items.push({
										name : name,
										value : dimensionValue.time,
										type : 'dimension'
									});
								}
								if (dimensionValue.day) {
									items.push({
										name : dimensionValue.time ? "" : name,
										value : dimensionValue.day,
										type : 'dimension'
									});
								}
								displayValue = dimensionValue.time;
								if (dimensionValue.day) {
									if (!displayValue || displayValue.length < dimensionValue.day.length) {
										displayValue = dimensionValue.day;
									}
								}
							}
						}

						if (actionName === 'popover' && !isLongMode) {
							if (values[i].name.length > MAX_MEASURE_LABLE_LEN ||
							 displayValue.length > MAX_MEASURE_VALUE_LEN){
								isLongMode = true;
							} else {
								//for fiscal, one or two labels.
								if (fiscalLabels && fiscalLabels.length > 0 &&
									fiscalLabels[0].length > MAX_MEASURE_LABLE_LEN) {
									isLongMode = true;
								}
								if (fiscalLabels && fiscalLabels.length > 1 &&
									fiscalLabels[1].length > MAX_MEASURE_LABLE_LEN) {
									isLongMode = true;
								}
							}
						}
				} else {
					if (dims == null) {
						dims = getNoValueLabel();
					} else if (dims.length > 0) {
						if (dimensionValue === null) {
							dims = dims + ' - ' + getNoValueLabel();
						} else {
							dims = dims + ' - ' + dimensionValue;
						}
					} else {
						if (dimensionValue === null) {
							dims = getNoValueLabel();
						} else {
						dims = dimensionValue.toString();
						}
					}
					if (actionName === 'toolTip') {
						items.push({
							name : name,
							value : dimensionValue,
							type : 'dimension'
						});
					}
				}
			} else if (values[i].type && values[i].type.toLowerCase()  === 'measure') {
				items.push({
					name : name,
					value : values[i].value,
					unit : values[i].unit,
					type : 'measure'
				});

				if (actionName === 'popover' && !isLongMode) {
					measureValue = values[i].value;
					if (measureValue == null) {
						measureValue = getNoValueLabel();
					}
					if ((values[i].dataName || values[i].name).length > MAX_MEASURE_LABLE_LEN ||
							measureValue.toString().length > MAX_MEASURE_VALUE_LEN) {
						isLongMode = true;
					}
				}
			}

		}
		results.items = items;
		results.isLongMode = isLongMode;
		results.dims = dims;

		return results;
	};

	return ContentUtil;
});
