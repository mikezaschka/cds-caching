/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides class sap.ui.core.BaseChartMetadata
sap.ui.define(['sap/ui/core/ElementMetadata'],
	function(ElementMetadata) {
	"use strict";


	/**
	 * Creates a new metadata object for a UIElement subclass.
	 *
	 * @param {string} sClassName fully qualified name of the class that is described by this metadata object
	 * @param {object} oClassInfo static info to construct the metadata from
	 *
	 * @class
	 * @author SAP SE
	 * @version 1.136.0
	 * @since 1.30.0
	 * @alias sap.viz.ui5.core.BaseChartMetadata
	 */
	var BaseChartMetadata = function(sClassName, oClassInfo) {
		oClassInfo = oClassInfo || {};
		oClassInfo.renderer = oClassInfo.renderer || 'sap.viz.ui5.core.BaseChartRenderer';
		this.sVizChartType = (oClassInfo.metadata && oClassInfo.metadata.vizChartType) || undefined;
		// call super constructor
		ElementMetadata.call(this, sClassName, oClassInfo);
	};

	//chain the prototypes
	BaseChartMetadata.prototype = Object.create(ElementMetadata.prototype);
	BaseChartMetadata.prototype.constructor = BaseChartMetadata;

	BaseChartMetadata.prototype.getVIZChartType = function() {
		return this.sVizChartType;
	};

	// ----

	var BaseAggregation = ElementMetadata.prototype.metaFactoryAggregation;

	function VizAggregation(oClass, name, info) {
		BaseAggregation.call(this, oClass, name, info);
	}

	VizAggregation.prototype = Object.create(BaseAggregation.prototype);
	VizAggregation.prototype.constructor = VizAggregation;

	VizAggregation.prototype.generate = function(add) {
		var n = this.name;
		add(this._sGetter, function() {
			return this._getOrCreate(n);
		});
		BaseAggregation.prototype.generate.call(this, add);
	};

	BaseChartMetadata.prototype.metaFactoryAggregation = VizAggregation;

	// ----

	var BaseEvent = ElementMetadata.prototype.metaFactoryEvent;

	function VizEvent(oClass, name, info) {
		BaseEvent.call(this, oClass, name, info);
	}

	VizEvent.prototype = Object.create(BaseEvent.prototype);
	VizEvent.prototype.constructor = VizEvent;

	VizEvent.prototype.generate = function(add) {
		var n = this.name;
		add(this._sMutator, function(d,f,l) {
			return this._attachVIZEvent(n, d,f,l);
		});
		add(this._sDetachMutator, function(d,f,l) {
			return this._detachVIZEvent(n, f,l);
		});
		BaseEvent.prototype.generate.call(this, add);
	};

	BaseChartMetadata.prototype.metaFactoryEvent = VizEvent;

	return BaseChartMetadata;
});
