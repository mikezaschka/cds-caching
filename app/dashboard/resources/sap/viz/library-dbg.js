/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

/**
 * Initialization Code and shared classes of library sap.viz.
 */
sap.ui.define([
	"sap/base/Log",
	"sap/base/i18n/Formatting",
	"sap/base/i18n/Localization",
	"sap/base/i18n/date/CalendarWeekNumbering",
	"sap/base/util/ObjectPath",
	"sap/ui/Device",
	"sap/ui/base/DataType",
	"sap/ui/core/Lib",
	"sap/ui/core/Theming",
	"sap/ui/core/date/UI5Date",
	"sap/ui/core/date/UniversalDate",
	"sap/ui/core/date/UniversalDateUtils",
	"sap/ui/core/date/CalendarUtils",
	"sap/ui/core/format/TimezoneUtil",
	"sap/ui/core/theming/Parameters",
	"sap/ui/thirdparty/jquery",
	"sap/viz/libs/CssPlugin",
	'sap/viz/ui5/format/ChartFormatter',
	'sap/viz/ui5/api/env/Format',
	// library dependency
	"sap/ui/core/library",
	"sap/ui/thirdparty/d3",
	// TODO get rid of this (but see BCP 2070358415 first)
	"sap/ui/thirdparty/jqueryui/jquery-ui-core",
	// TODO get rid of this (but see BCP 2070358415 first)
	"sap/ui/thirdparty/jqueryui/jquery-ui-widget",
	// TODO get rid of this (but see BCP 2070358415 first)
	"sap/ui/thirdparty/jqueryui/jquery-ui-mouse",
	// TODO get rid of this (but see BCP 2070358415 first)
	"sap/ui/thirdparty/jqueryui/jquery-ui-draggable",
	// TODO get rid of this (but see BCP 2070358415 first)
	"sap/ui/thirdparty/jqueryui/jquery-ui-droppable",
	"sap/viz/libs/canvg",
	"sap/viz/libs/rgbcolor",
	"sap/viz/libs/sap-viz-info-framework",
	"sap/viz/libs/sap-viz-info-charts",
	"sap/viz/resources/chart/templates/standard_fiori/template",
	"sap/viz/ui5/controls/libs/sap-viz-vizframe/sap-viz-vizframe",
	"sap/viz/ui5/controls/libs/sap-viz-vizservices/sap-viz-vizservices",
	"sap/ui/thirdparty/require"
],
	function(
		Log,
		Formatting,
		Localization,
		CalendarWeekNumbering,
		ObjectPath,
		Device,
		DataType,
		Library,
		Theming,
		UI5Date,
		UniversalDate,
		UniversalDateUtils,
		CalendarUtils,
		TimezoneUtil,
		Parameters,
		jQuery,
		CssPlugin
	) {
	"use strict";

	/**
	 * Chart controls based on the SAP BI CVOM charting library
	 *
	 * @namespace
	 * @alias sap.viz
	 * @public
	 */
	const thisLib = Library.init({
		name : "sap.viz",
		apiVersion: 2,
		dependencies : ["sap.ui.core"],
		types: [
			//@@begin generated-types-list
			"sap.viz.ui5.types.Area_drawingEffect",
			"sap.viz.ui5.types.Area_marker_shape",
			"sap.viz.ui5.types.Area_mode",
			"sap.viz.ui5.types.Area_orientation",
			"sap.viz.ui5.types.Axis_gridline_type",
			"sap.viz.ui5.types.Axis_label_unitFormatType",
			"sap.viz.ui5.types.Axis_position",
			"sap.viz.ui5.types.Axis_type",
			"sap.viz.ui5.types.Background_direction",
			"sap.viz.ui5.types.Background_drawingEffect",
			"sap.viz.ui5.types.Bar_drawingEffect",
			"sap.viz.ui5.types.Bar_orientation",
			"sap.viz.ui5.types.Bubble_drawingEffect",
			"sap.viz.ui5.types.Bullet_drawingEffect",
			"sap.viz.ui5.types.Bullet_orientation",
			"sap.viz.ui5.types.Combination_drawingEffect",
			"sap.viz.ui5.types.Combination_orientation",
			"sap.viz.ui5.types.Datalabel_orientation",
			"sap.viz.ui5.types.Datalabel_outsidePosition",
			"sap.viz.ui5.types.Datalabel_paintingMode",
			"sap.viz.ui5.types.Datalabel_position",
			"sap.viz.ui5.types.Legend_layout_position",
			"sap.viz.ui5.types.Line_drawingEffect",
			"sap.viz.ui5.types.Line_marker_shape",
			"sap.viz.ui5.types.Line_orientation",
			"sap.viz.ui5.types.Pie_drawingEffect",
			"sap.viz.ui5.types.Pie_valign",
			"sap.viz.ui5.types.Scatter_drawingEffect",
			"sap.viz.ui5.types.StackedVerticalBar_drawingEffect",
			"sap.viz.ui5.types.StackedVerticalBar_mode",
			"sap.viz.ui5.types.StackedVerticalBar_orientation",
			"sap.viz.ui5.types.Title_alignment",
			"sap.viz.ui5.types.Tooltip_drawingEffect",
			"sap.viz.ui5.types.VerticalBar_drawingEffect",
			"sap.viz.ui5.types.VerticalBar_orientation",
			"sap.viz.ui5.types.controller.Interaction_pan_orientation",
			"sap.viz.ui5.types.controller.Interaction_selectability_mode",
			"sap.viz.ui5.types.legend.Common_alignment",
			"sap.viz.ui5.types.legend.Common_drawingEffect",
			"sap.viz.ui5.types.legend.Common_position",
			"sap.viz.ui5.types.legend.Common_type"




			//@@end generated-types-list
		],
		interfaces: [],
		controls: [
			"sap.viz.ui5.controls.chartpopover.ChartPopover",
			"sap.viz.ui5.controls.chartpopover.ContentPanel",
			"sap.viz.ui5.controls.chartpopover.HeaderBar",
			"sap.viz.ui5.controls.chartpopover.ShapeMarker",
			"sap.viz.ui5.controls.chartpopover.SubActionItemsPage",
			"sap.viz.ui5.controls.charttooltip.ContentPanel",
			"sap.viz.ui5.controls.charttooltip.TooltipContainer",
			"sap.viz.ui5.controls.common.BaseControl",
			"sap.viz.ui5.controls.Popover",
			"sap.viz.ui5.controls.VizFrame",
			"sap.viz.ui5.controls.VizRangeSlider",
			"sap.viz.ui5.controls.VizSlider",
			"sap.viz.ui5.controls.VizSliderBasic",
			"sap.viz.ui5.controls.VizTooltip",
			"sap.viz.ui5.core.BaseChart",
			"sap.viz.ui5.VizContainer",
			//@@begin generated-controls-list
			"sap.viz.ui5.Area",
			"sap.viz.ui5.Area100",
			"sap.viz.ui5.Bar",
			"sap.viz.ui5.Bubble",
			"sap.viz.ui5.Bullet",
			"sap.viz.ui5.Column",
			"sap.viz.ui5.Combination",
			"sap.viz.ui5.Donut",
			"sap.viz.ui5.DualBar",
			"sap.viz.ui5.DualColumn",
			"sap.viz.ui5.DualCombination",
			"sap.viz.ui5.DualLine",
			"sap.viz.ui5.DualStackedColumn",
			"sap.viz.ui5.DualStackedColumn100",
			"sap.viz.ui5.Heatmap",
			"sap.viz.ui5.HorizontalArea",
			"sap.viz.ui5.HorizontalArea100",
			"sap.viz.ui5.Line",
			"sap.viz.ui5.Pie",
			"sap.viz.ui5.Scatter",
			"sap.viz.ui5.StackedColumn",
			"sap.viz.ui5.StackedColumn100",
			"sap.viz.ui5.TimeBubble",
			"sap.viz.ui5.Treemap"



			//@@end generated-controls-list
		],
		elements: [
			"sap.viz.ui5.controls.common.feeds.AnalysisObject",
			"sap.viz.ui5.controls.common.feeds.FeedItem",
			"sap.viz.ui5.core.BaseStructuredType",
			"sap.viz.ui5.data.Dataset",
			"sap.viz.ui5.data.CustomDataset",
			"sap.viz.ui5.data.DimensionDefinition",
			"sap.viz.ui5.data.FlattenedDataset",
			"sap.viz.ui5.data.MeasureDefinition",
			//@@begin generated-elements-list
			"sap.viz.ui5.types.Area",
			"sap.viz.ui5.types.Area_animation",
			"sap.viz.ui5.types.Area_hoverline",
			"sap.viz.ui5.types.Area_marker",
			"sap.viz.ui5.types.Area_tooltip",
			"sap.viz.ui5.types.Axis",
			"sap.viz.ui5.types.Axis_axisTick",
			"sap.viz.ui5.types.Axis_axisline",
			"sap.viz.ui5.types.Axis_gridline",
			"sap.viz.ui5.types.Axis_indicator",
			"sap.viz.ui5.types.Axis_label",
			"sap.viz.ui5.types.Axis_layoutInfo",
			"sap.viz.ui5.types.Axis_scale",
			"sap.viz.ui5.types.Axis_title",
			"sap.viz.ui5.types.Background",
			"sap.viz.ui5.types.Background_border",
			"sap.viz.ui5.types.Background_border_bottom",
			"sap.viz.ui5.types.Background_border_left",
			"sap.viz.ui5.types.Background_border_right",
			"sap.viz.ui5.types.Background_border_top",
			"sap.viz.ui5.types.Bar",
			"sap.viz.ui5.types.Bar_animation",
			"sap.viz.ui5.types.Bar_tooltip",
			"sap.viz.ui5.types.Bubble",
			"sap.viz.ui5.types.Bubble_animation",
			"sap.viz.ui5.types.Bubble_axisTooltip",
			"sap.viz.ui5.types.Bubble_hoverline",
			"sap.viz.ui5.types.Bullet",
			"sap.viz.ui5.types.Bullet_tooltip",
			"sap.viz.ui5.types.Combination",
			"sap.viz.ui5.types.Combination_animation",
			"sap.viz.ui5.types.Combination_bar",
			"sap.viz.ui5.types.Combination_dataShape",
			"sap.viz.ui5.types.Combination_line",
			"sap.viz.ui5.types.Combination_line_marker",
			"sap.viz.ui5.types.Combination_tooltip",
			"sap.viz.ui5.types.Datalabel",
			"sap.viz.ui5.types.Datatransform",
			"sap.viz.ui5.types.Datatransform_autoBinning",
			"sap.viz.ui5.types.Datatransform_dataSampling",
			"sap.viz.ui5.types.Datatransform_dataSampling_grid",
			"sap.viz.ui5.types.Heatmap",
			"sap.viz.ui5.types.Heatmap_animation",
			"sap.viz.ui5.types.Heatmap_border",
			"sap.viz.ui5.types.Heatmap_tooltip",
			"sap.viz.ui5.types.Legend",
			"sap.viz.ui5.types.Legend_layout",
			"sap.viz.ui5.types.Line",
			"sap.viz.ui5.types.Line_animation",
			"sap.viz.ui5.types.Line_hoverline",
			"sap.viz.ui5.types.Line_marker",
			"sap.viz.ui5.types.Line_tooltip",
			"sap.viz.ui5.types.Pie",
			"sap.viz.ui5.types.Pie_animation",
			"sap.viz.ui5.types.Pie_tooltip",
			"sap.viz.ui5.types.RootContainer",
			"sap.viz.ui5.types.RootContainer_layout",
			"sap.viz.ui5.types.Scatter",
			"sap.viz.ui5.types.Scatter_animation",
			"sap.viz.ui5.types.Scatter_axisTooltip",
			"sap.viz.ui5.types.Scatter_hoverline",
			"sap.viz.ui5.types.StackedVerticalBar",
			"sap.viz.ui5.types.StackedVerticalBar_animation",
			"sap.viz.ui5.types.StackedVerticalBar_tooltip",
			"sap.viz.ui5.types.Title",
			"sap.viz.ui5.types.Title_layout",
			"sap.viz.ui5.types.Tooltip",
			"sap.viz.ui5.types.Tooltip_background",
			"sap.viz.ui5.types.Tooltip_bodyDimensionLabel",
			"sap.viz.ui5.types.Tooltip_bodyDimensionValue",
			"sap.viz.ui5.types.Tooltip_bodyMeasureLabel",
			"sap.viz.ui5.types.Tooltip_bodyMeasureValue",
			"sap.viz.ui5.types.Tooltip_closeButton",
			"sap.viz.ui5.types.Tooltip_footerLabel",
			"sap.viz.ui5.types.Tooltip_separationLine",
			"sap.viz.ui5.types.Treemap",
			"sap.viz.ui5.types.Treemap_animation",
			"sap.viz.ui5.types.Treemap_border",
			"sap.viz.ui5.types.Treemap_tooltip",
			"sap.viz.ui5.types.VerticalBar",
			"sap.viz.ui5.types.VerticalBar_animation",
			"sap.viz.ui5.types.VerticalBar_tooltip",
			"sap.viz.ui5.types.XYContainer",
			"sap.viz.ui5.types.controller.Interaction",
			"sap.viz.ui5.types.controller.Interaction_pan",
			"sap.viz.ui5.types.controller.Interaction_selectability",
			"sap.viz.ui5.types.layout.Dock",
			"sap.viz.ui5.types.layout.Stack",
			"sap.viz.ui5.types.legend.Common",
			"sap.viz.ui5.types.legend.Common_title"




			//@@end generated-elements-list
		],
		version: "1.136.0"
	});

	//@@begin generated-enums
	/**
	 * List (Enum) type sap.viz.ui5.types.Area_drawingEffect
	 *
	 * @enum {string}
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.32.0.
	 * The chart controls in the <code>sap.viz.ui5</code> package (which were always marked as <i>experimental</i>) have been deprecated since 1.32.0.
	 * They are no longer actively developed and won't receive new features or improvements, only important bug fixes. They will only remain in the
	 * SAPUI5 distribution for backward compatibility.
	 *
	 * <b>SAP strongly recommends that existing consumers of those controls migrate to the new {@link sap.viz.ui5.controls.VizFrame VizFrame}
	 * control to benefit from new charting enhancements and timely support. </b>
	 *
	 * <b>Note</b>: As the feature set, design and API usage of VizFrame might differ from the old chart controls, make sure you evaluate it thoroughly before migration.
	 * @experimental Since version 1.7.2.
	 * Charting API is not finished yet and might change completely.
	 */
	 thisLib.ui5.types.Area_drawingEffect = {

		/**
		 * Value normal
		 * @public
		 */
		normal : "normal",

		/**
		 * Value glossy
		 * @public
		 */
		glossy : "glossy"
	};
	/** @deprecated Since version 1.32.0. */
	DataType.registerEnum("sap.viz.ui5.types.Area_drawingEffect", thisLib.ui5.types.Area_drawingEffect);

	/**
	 * List (Enum) type sap.viz.ui5.types.Area_marker_shape
	 *
	 * @enum {string}
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.32.0.
	 * The chart controls in the <code>sap.viz.ui5</code> package (which were always marked as <i>experimental</i>) have been deprecated since 1.32.0.
	 * They are no longer actively developed and won't receive new features or improvements, only important bug fixes. They will only remain in the
	 * SAPUI5 distribution for backward compatibility.
	 *
	 * <b>SAP strongly recommends that existing consumers of those controls migrate to the new {@link sap.viz.ui5.controls.VizFrame VizFrame}
	 * control to benefit from new charting enhancements and timely support. </b>
	 *
	 * <b>Note</b>: As the feature set, design and API usage of VizFrame might differ from the old chart controls, make sure you evaluate it thoroughly before migration.
	 * @experimental Since version 1.7.2.
	 * Charting API is not finished yet and might change completely.
	 */
	 thisLib.ui5.types.Area_marker_shape = {

		/**
		 * Value circle
		 * @public
		 */
		circle : "circle",

		/**
		 * Value diamond
		 * @public
		 */
		diamond : "diamond",

		/**
		 * Value triangleUp
		 * @public
		 */
		triangleUp : "triangleUp",

		/**
		 * Value triangleDown
		 * @public
		 */
		triangleDown : "triangleDown",

		/**
		 * Value triangleLeft
		 * @public
		 */
		triangleLeft : "triangleLeft",

		/**
		 * Value triangleRight
		 * @public
		 */
		triangleRight : "triangleRight",

		/**
		 * Value cross
		 * @public
		 */
		cross : "cross",

		/**
		 * Value intersection
		 * @public
		 */
		intersection : "intersection"
	};
	/** @deprecated Since version 1.32.0. */
	DataType.registerEnum("sap.viz.ui5.types.Area_marker_shape", thisLib.ui5.types.Area_marker_shape);

	/**
	 * List (Enum) type sap.viz.ui5.types.Area_mode
	 *
	 * @enum {string}
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.32.0.
	 * The chart controls in the <code>sap.viz.ui5</code> package (which were always marked as <i>experimental</i>) have been deprecated since 1.32.0.
	 * They are no longer actively developed and won't receive new features or improvements, only important bug fixes. They will only remain in the
	 * SAPUI5 distribution for backward compatibility.
	 *
	 * <b>SAP strongly recommends that existing consumers of those controls migrate to the new {@link sap.viz.ui5.controls.VizFrame VizFrame}
	 * control to benefit from new charting enhancements and timely support. </b>
	 *
	 * <b>Note</b>: As the feature set, design and API usage of VizFrame might differ from the old chart controls, make sure you evaluate it thoroughly before migration.
	 * @experimental Since version 1.7.2.
	 * Charting API is not finished yet and might change completely.
	 */
	thisLib.ui5.types.Area_mode = {

		/**
		 * Value comparison
		 * @public
		 */
		comparison : "comparison",

		/**
		 * Value percentage
		 * @public
		 */
		percentage : "percentage"
	};
	/** @deprecated Since version 1.32.0. */
	DataType.registerEnum("sap.viz.ui5.types.Area_mode", thisLib.ui5.types.Area_mode);

	/**
	 * List (Enum) type sap.viz.ui5.types.Area_orientation
	 *
	 * @enum {string}
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.32.0.
	 * The chart controls in the <code>sap.viz.ui5</code> package (which were always marked as <i>experimental</i>) have been deprecated since 1.32.0.
	 * They are no longer actively developed and won't receive new features or improvements, only important bug fixes. They will only remain in the
	 * SAPUI5 distribution for backward compatibility.
	 *
	 * <b>SAP strongly recommends that existing consumers of those controls migrate to the new {@link sap.viz.ui5.controls.VizFrame VizFrame}
	 * control to benefit from new charting enhancements and timely support. </b>
	 *
	 * <b>Note</b>: As the feature set, design and API usage of VizFrame might differ from the old chart controls, make sure you evaluate it thoroughly before migration.
	 * @experimental Since version 1.7.2.
	 * Charting API is not finished yet and might change completely.
	 */
	thisLib.ui5.types.Area_orientation = {

		/**
		 * Value vertical
		 * @public
		 */
		vertical : "vertical",

		/**
		 * Value horizontal
		 * @public
		 */
		horizontal : "horizontal"
	};
	/** @deprecated Since version 1.32.0. */
	DataType.registerEnum("sap.viz.ui5.types.Area_orientation", thisLib.ui5.types.Area_orientation);

	/**
	 * List (Enum) type sap.viz.ui5.types.Axis_gridline_type
	 *
	 * @enum {string}
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.32.0.
	 * The chart controls in the <code>sap.viz.ui5</code> package (which were always marked as <i>experimental</i>) have been deprecated since 1.32.0.
	 * They are no longer actively developed and won't receive new features or improvements, only important bug fixes. They will only remain in the
	 * SAPUI5 distribution for backward compatibility.
	 *
	 * <b>SAP strongly recommends that existing consumers of those controls migrate to the new {@link sap.viz.ui5.controls.VizFrame VizFrame}
	 * control to benefit from new charting enhancements and timely support. </b>
	 *
	 * <b>Note</b>: As the feature set, design and API usage of VizFrame might differ from the old chart controls, make sure you evaluate it thoroughly before migration.
	 * @experimental Since version 1.7.2.
	 * Charting API is not finished yet and might change completely.
	 */
	thisLib.ui5.types.Axis_gridline_type = {

		/**
		 * Value line
		 * @public
		 */
		line : "line",

		/**
		 * Value dotted
		 * @public
		 */
		dotted : "dotted",

		/**
		 * Value incised
		 * @public
		 */
		incised : "incised"
	};
	/** @deprecated Since version 1.32.0. */
	DataType.registerEnum("sap.viz.ui5.types.Axis_gridline_type", thisLib.ui5.types.Axis_gridline_type);

	/**
	 * List (Enum) type sap.viz.ui5.types.Axis_label_unitFormatType
	 *
	 * @enum {string}
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.32.0.
	 * The chart controls in the <code>sap.viz.ui5</code> package (which were always marked as <i>experimental</i>) have been deprecated since 1.32.0.
	 * They are no longer actively developed and won't receive new features or improvements, only important bug fixes. They will only remain in the
	 * SAPUI5 distribution for backward compatibility.
	 *
	 * <b>SAP strongly recommends that existing consumers of those controls migrate to the new {@link sap.viz.ui5.controls.VizFrame VizFrame}
	 * control to benefit from new charting enhancements and timely support. </b>
	 *
	 * <b>Note</b>: As the feature set, design and API usage of VizFrame might differ from the old chart controls, make sure you evaluate it thoroughly before migration.
	 * @experimental Since version 1.7.2.
	 * Charting API is not finished yet and might change completely.
	 */
	thisLib.ui5.types.Axis_label_unitFormatType = {

		/**
		 * Value MetricUnits
		 * @public
		 */
		MetricUnits : "MetricUnits",

		/**
		 * Value FinancialUnits
		 * @public
		 */
		FinancialUnits : "FinancialUnits"
	};
	/** @deprecated Since version 1.32.0. */
	DataType.registerEnum("sap.viz.ui5.types.Axis_label_unitFormatType", thisLib.ui5.types.Axis_label_unitFormatType);

	/**
	 * List (Enum) type sap.viz.ui5.types.Axis_position
	 *
	 * @enum {string}
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.32.0.
	 * The chart controls in the <code>sap.viz.ui5</code> package (which were always marked as <i>experimental</i>) have been deprecated since 1.32.0.
	 * They are no longer actively developed and won't receive new features or improvements, only important bug fixes. They will only remain in the
	 * SAPUI5 distribution for backward compatibility.
	 *
	 * <b>SAP strongly recommends that existing consumers of those controls migrate to the new {@link sap.viz.ui5.controls.VizFrame VizFrame}
	 * control to benefit from new charting enhancements and timely support. </b>
	 *
	 * <b>Note</b>: As the feature set, design and API usage of VizFrame might differ from the old chart controls, make sure you evaluate it thoroughly before migration.
	 * @experimental Since version 1.7.2.
	 * Charting API is not finished yet and might change completely.
	 */
	thisLib.ui5.types.Axis_position = {

		/**
		 * Value left
		 * @public
		 */
		left : "left",

		/**
		 * Value right
		 * @public
		 */
		right : "right",

		/**
		 * Value top
		 * @public
		 */
		top : "top",

		/**
		 * Value bottom
		 * @public
		 */
		bottom : "bottom"
	};
	/** @deprecated Since version 1.32.0. */
	DataType.registerEnum("sap.viz.ui5.types.Axis_position", thisLib.ui5.types.Axis_position);

	/**
	 * List (Enum) type sap.viz.ui5.types.Axis_type
	 *
	 * @enum {string}
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.32.0.
	 * The chart controls in the <code>sap.viz.ui5</code> package (which were always marked as <i>experimental</i>) have been deprecated since 1.32.0.
	 * They are no longer actively developed and won't receive new features or improvements, only important bug fixes. They will only remain in the
	 * SAPUI5 distribution for backward compatibility.
	 *
	 * <b>SAP strongly recommends that existing consumers of those controls migrate to the new {@link sap.viz.ui5.controls.VizFrame VizFrame}
	 * control to benefit from new charting enhancements and timely support. </b>
	 *
	 * <b>Note</b>: As the feature set, design and API usage of VizFrame might differ from the old chart controls, make sure you evaluate it thoroughly before migration.
	 * @experimental Since version 1.7.2.
	 * Charting API is not finished yet and might change completely.
	 */
	thisLib.ui5.types.Axis_type = {

		/**
		 * Value value
		 * @public
		 */
		value : "value",

		/**
		 * Value category
		 * @public
		 */
		category : "category",

		/**
		 * Value timeValue
		 * @public
		 */
		timeValue : "timeValue"
	};
	/** @deprecated Since version 1.32.0. */
	DataType.registerEnum("sap.viz.ui5.types.Axis_type", thisLib.ui5.types.Axis_type);

	/**
	 * List (Enum) type sap.viz.ui5.types.Background_direction
	 *
	 * @enum {string}
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.32.0.
	 * The chart controls in the <code>sap.viz.ui5</code> package (which were always marked as <i>experimental</i>) have been deprecated since 1.32.0.
	 * They are no longer actively developed and won't receive new features or improvements, only important bug fixes. They will only remain in the
	 * SAPUI5 distribution for backward compatibility.
	 *
	 * <b>SAP strongly recommends that existing consumers of those controls migrate to the new {@link sap.viz.ui5.controls.VizFrame VizFrame}
	 * control to benefit from new charting enhancements and timely support. </b>
	 *
	 * <b>Note</b>: As the feature set, design and API usage of VizFrame might differ from the old chart controls, make sure you evaluate it thoroughly before migration.
	 * @experimental Since version 1.7.2.
	 * Charting API is not finished yet and might change completely.
	 */
	thisLib.ui5.types.Background_direction = {

		/**
		 * Value horizontal
		 * @public
		 */
		horizontal : "horizontal",

		/**
		 * Value vertical
		 * @public
		 */
		vertical : "vertical"
	};
	/** @deprecated Since version 1.32.0. */
	DataType.registerEnum("sap.viz.ui5.types.Background_direction", thisLib.ui5.types.Background_direction);

	/**
	 * List (Enum) type sap.viz.ui5.types.Background_drawingEffect
	 *
	 * @enum {string}
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.32.0.
	 * The chart controls in the <code>sap.viz.ui5</code> package (which were always marked as <i>experimental</i>) have been deprecated since 1.32.0.
	 * They are no longer actively developed and won't receive new features or improvements, only important bug fixes. They will only remain in the
	 * SAPUI5 distribution for backward compatibility.
	 *
	 * <b>SAP strongly recommends that existing consumers of those controls migrate to the new {@link sap.viz.ui5.controls.VizFrame VizFrame}
	 * control to benefit from new charting enhancements and timely support. </b>
	 *
	 * <b>Note</b>: As the feature set, design and API usage of VizFrame might differ from the old chart controls, make sure you evaluate it thoroughly before migration.
	 * @experimental Since version 1.7.2.
	 * Charting API is not finished yet and might change completely.
	 */
	thisLib.ui5.types.Background_drawingEffect = {

		/**
		 * Value normal
		 * @public
		 */
		normal : "normal",

		/**
		 * Value glossy
		 * @public
		 */
		glossy : "glossy"
	};
	/** @deprecated Since version 1.32.0. */
	DataType.registerEnum("sap.viz.ui5.types.Background_drawingEffect", thisLib.ui5.types.Background_drawingEffect);

	/**
	 * List (Enum) type sap.viz.ui5.types.Bar_drawingEffect
	 *
	 * @enum {string}
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.32.0.
	 * The chart controls in the <code>sap.viz.ui5</code> package (which were always marked as <i>experimental</i>) have been deprecated since 1.32.0.
	 * They are no longer actively developed and won't receive new features or improvements, only important bug fixes. They will only remain in the
	 * SAPUI5 distribution for backward compatibility.
	 *
	 * <b>SAP strongly recommends that existing consumers of those controls migrate to the new {@link sap.viz.ui5.controls.VizFrame VizFrame}
	 * control to benefit from new charting enhancements and timely support. </b>
	 *
	 * <b>Note</b>: As the feature set, design and API usage of VizFrame might differ from the old chart controls, make sure you evaluate it thoroughly before migration.
	 * @experimental Since version 1.7.2.
	 * Charting API is not finished yet and might change completely.
	 */
	thisLib.ui5.types.Bar_drawingEffect = {

		/**
		 * Value normal
		 * @public
		 */
		normal : "normal",

		/**
		 * Value glossy
		 * @public
		 */
		glossy : "glossy"
	};
	/** @deprecated Since version 1.32.0. */
	DataType.registerEnum("sap.viz.ui5.types.Bar_drawingEffect", thisLib.ui5.types.Bar_drawingEffect);

	/**
	 * List (Enum) type sap.viz.ui5.types.Bar_orientation
	 *
	 * @enum {string}
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.32.0.
	 * The chart controls in the <code>sap.viz.ui5</code> package (which were always marked as <i>experimental</i>) have been deprecated since 1.32.0.
	 * They are no longer actively developed and won't receive new features or improvements, only important bug fixes. They will only remain in the
	 * SAPUI5 distribution for backward compatibility.
	 *
	 * <b>SAP strongly recommends that existing consumers of those controls migrate to the new {@link sap.viz.ui5.controls.VizFrame VizFrame}
	 * control to benefit from new charting enhancements and timely support. </b>
	 *
	 * <b>Note</b>: As the feature set, design and API usage of VizFrame might differ from the old chart controls, make sure you evaluate it thoroughly before migration.
	 * @experimental Since version 1.7.2.
	 * Charting API is not finished yet and might change completely.
	 */
	thisLib.ui5.types.Bar_orientation = {

		/**
		 * Value horizontal
		 * @public
		 */
		horizontal : "horizontal",

		/**
		 * Value vertical
		 * @public
		 */
		vertical : "vertical"
	};
	/** @deprecated Since version 1.32.0. */
	DataType.registerEnum("sap.viz.ui5.types.Bar_orientation", thisLib.ui5.types.Bar_orientation);

	/**
	 * List (Enum) type sap.viz.ui5.types.Bubble_drawingEffect
	 *
	 * @enum {string}
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.32.0.
	 * The chart controls in the <code>sap.viz.ui5</code> package (which were always marked as <i>experimental</i>) have been deprecated since 1.32.0.
	 * They are no longer actively developed and won't receive new features or improvements, only important bug fixes. They will only remain in the
	 * SAPUI5 distribution for backward compatibility.
	 *
	 * <b>SAP strongly recommends that existing consumers of those controls migrate to the new {@link sap.viz.ui5.controls.VizFrame VizFrame}
	 * control to benefit from new charting enhancements and timely support. </b>
	 *
	 * <b>Note</b>: As the feature set, design and API usage of VizFrame might differ from the old chart controls, make sure you evaluate it thoroughly before migration.
	 * @experimental Since version 1.7.2.
	 * Charting API is not finished yet and might change completely.
	 */
	thisLib.ui5.types.Bubble_drawingEffect = {

		/**
		 * Value normal
		 * @public
		 */
		normal : "normal",

		/**
		 * Value glossy
		 * @public
		 */
		glossy : "glossy"
	};
	/** @deprecated Since version 1.32.0. */
	DataType.registerEnum("sap.viz.ui5.types.Bubble_drawingEffect", thisLib.ui5.types.Bubble_drawingEffect);

	/**
	 * List (Enum) type sap.viz.ui5.types.Bullet_drawingEffect
	 *
	 * @enum {string}
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.32.0.
	 * The chart controls in the <code>sap.viz.ui5</code> package (which were always marked as <i>experimental</i>) have been deprecated since 1.32.0.
	 * They are no longer actively developed and won't receive new features or improvements, only important bug fixes. They will only remain in the
	 * SAPUI5 distribution for backward compatibility.
	 *
	 * <b>SAP strongly recommends that existing consumers of those controls migrate to the new {@link sap.viz.ui5.controls.VizFrame VizFrame}
	 * control to benefit from new charting enhancements and timely support. </b>
	 *
	 * <b>Note</b>: As the feature set, design and API usage of VizFrame might differ from the old chart controls, make sure you evaluate it thoroughly before migration.
	 * @experimental Since version 1.7.2.
	 * Charting API is not finished yet and might change completely.
	 */
	thisLib.ui5.types.Bullet_drawingEffect = {

		/**
		 * Value normal
		 * @public
		 */
		normal : "normal",

		/**
		 * Value glossy
		 * @public
		 */
		glossy : "glossy"
	};
	/** @deprecated Since version 1.32.0. */
	DataType.registerEnum("sap.viz.ui5.types.Bullet_drawingEffect", thisLib.ui5.types.Bullet_drawingEffect);

	/**
	 * List (Enum) type sap.viz.ui5.types.Bullet_orientation
	 *
	 * @enum {string}
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.32.0.
	 * The chart controls in the <code>sap.viz.ui5</code> package (which were always marked as <i>experimental</i>) have been deprecated since 1.32.0.
	 * They are no longer actively developed and won't receive new features or improvements, only important bug fixes. They will only remain in the
	 * SAPUI5 distribution for backward compatibility.
	 *
	 * <b>SAP strongly recommends that existing consumers of those controls migrate to the new {@link sap.viz.ui5.controls.VizFrame VizFrame}
	 * control to benefit from new charting enhancements and timely support. </b>
	 *
	 * <b>Note</b>: As the feature set, design and API usage of VizFrame might differ from the old chart controls, make sure you evaluate it thoroughly before migration.
	 * @experimental Since version 1.7.2.
	 * Charting API is not finished yet and might change completely.
	 */
	thisLib.ui5.types.Bullet_orientation = {

		/**
		 * Value horizontal
		 * @public
		 */
		horizontal : "horizontal",

		/**
		 * Value vertical
		 * @public
		 */
		vertical : "vertical"
	};
	/** @deprecated Since version 1.32.0. */
	DataType.registerEnum("sap.viz.ui5.types.Bullet_orientation", thisLib.ui5.types.Bullet_orientation);

	/**
	 * List (Enum) type sap.viz.ui5.types.Combination_drawingEffect
	 *
	 * @enum {string}
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.32.0.
	 * The chart controls in the <code>sap.viz.ui5</code> package (which were always marked as <i>experimental</i>) have been deprecated since 1.32.0.
	 * They are no longer actively developed and won't receive new features or improvements, only important bug fixes. They will only remain in the
	 * SAPUI5 distribution for backward compatibility.
	 *
	 * <b>SAP strongly recommends that existing consumers of those controls migrate to the new {@link sap.viz.ui5.controls.VizFrame VizFrame}
	 * control to benefit from new charting enhancements and timely support. </b>
	 *
	 * <b>Note</b>: As the feature set, design and API usage of VizFrame might differ from the old chart controls, make sure you evaluate it thoroughly before migration.
	 * @experimental Since version 1.7.2.
	 * Charting API is not finished yet and might change completely.
	 */
	thisLib.ui5.types.Combination_drawingEffect = {

		/**
		 * Value normal
		 * @public
		 */
		normal : "normal",

		/**
		 * Value glossy
		 * @public
		 */
		glossy : "glossy"
	};
	/** @deprecated Since version 1.32.0. */
	DataType.registerEnum("sap.viz.ui5.types.Combination_drawingEffect", thisLib.ui5.types.Combination_drawingEffect);

	/**
	 * List (Enum) type sap.viz.ui5.types.Combination_orientation
	 *
	 * @enum {string}
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.32.0.
	 * The chart controls in the <code>sap.viz.ui5</code> package (which were always marked as <i>experimental</i>) have been deprecated since 1.32.0.
	 * They are no longer actively developed and won't receive new features or improvements, only important bug fixes. They will only remain in the
	 * SAPUI5 distribution for backward compatibility.
	 *
	 * <b>SAP strongly recommends that existing consumers of those controls migrate to the new {@link sap.viz.ui5.controls.VizFrame VizFrame}
	 * control to benefit from new charting enhancements and timely support. </b>
	 *
	 * <b>Note</b>: As the feature set, design and API usage of VizFrame might differ from the old chart controls, make sure you evaluate it thoroughly before migration.
	 * @experimental Since version 1.7.2.
	 * Charting API is not finished yet and might change completely.
	 */
	thisLib.ui5.types.Combination_orientation = {

		/**
		 * Value horizontal
		 * @public
		 */
		horizontal : "horizontal",

		/**
		 * Value vertical
		 * @public
		 */
		vertical : "vertical"
	};
	/** @deprecated Since version 1.32.0. */
	DataType.registerEnum("sap.viz.ui5.types.Combination_orientation", thisLib.ui5.types.Combination_orientation);

	/**
	 * List (Enum) type sap.viz.ui5.types.Datalabel_orientation
	 *
	 * @enum {string}
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.32.0.
	 * The chart controls in the <code>sap.viz.ui5</code> package (which were always marked as <i>experimental</i>) have been deprecated since 1.32.0.
	 * They are no longer actively developed and won't receive new features or improvements, only important bug fixes. They will only remain in the
	 * SAPUI5 distribution for backward compatibility.
	 *
	 * <b>SAP strongly recommends that existing consumers of those controls migrate to the new {@link sap.viz.ui5.controls.VizFrame VizFrame}
	 * control to benefit from new charting enhancements and timely support. </b>
	 *
	 * <b>Note</b>: As the feature set, design and API usage of VizFrame might differ from the old chart controls, make sure you evaluate it thoroughly before migration.
	 * @experimental Since version 1.7.2.
	 * Charting API is not finished yet and might change completely.
	 */
	thisLib.ui5.types.Datalabel_orientation = {

		/**
		 * Value horizontal
		 * @public
		 */
		horizontal : "horizontal",

		/**
		 * Value vertical
		 * @public
		 */
		vertical : "vertical"
	};
	/** @deprecated Since version 1.32.0. */
	DataType.registerEnum("sap.viz.ui5.types.Datalabel_orientation", thisLib.ui5.types.Datalabel_orientation);

	/**
	 * List (Enum) type sap.viz.ui5.types.Datalabel_outsidePosition
	 *
	 * @enum {string}
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.32.0.
	 * The chart controls in the <code>sap.viz.ui5</code> package (which were always marked as <i>experimental</i>) have been deprecated since 1.32.0.
	 * They are no longer actively developed and won't receive new features or improvements, only important bug fixes. They will only remain in the
	 * SAPUI5 distribution for backward compatibility.
	 *
	 * <b>SAP strongly recommends that existing consumers of those controls migrate to the new {@link sap.viz.ui5.controls.VizFrame VizFrame}
	 * control to benefit from new charting enhancements and timely support. </b>
	 *
	 * <b>Note</b>: As the feature set, design and API usage of VizFrame might differ from the old chart controls, make sure you evaluate it thoroughly before migration.
	 * @experimental Since version 1.7.2.
	 * Charting API is not finished yet and might change completely.
	 */
	thisLib.ui5.types.Datalabel_outsidePosition = {

		/**
		 * Value up
		 * @public
		 */
		up : "up",

		/**
		 * Value down
		 * @public
		 */
		down : "down",

		/**
		 * Value left
		 * @public
		 */
		left : "left",

		/**
		 * Value right
		 * @public
		 */
		right : "right"
	};
	/** @deprecated Since version 1.32.0. */
	DataType.registerEnum("sap.viz.ui5.types.Datalabel_outsidePosition", thisLib.ui5.types.Datalabel_outsidePosition);

	/**
	 * List (Enum) type sap.viz.ui5.types.Datalabel_paintingMode
	 *
	 * @enum {string}
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.32.0.
	 * The chart controls in the <code>sap.viz.ui5</code> package (which were always marked as <i>experimental</i>) have been deprecated since 1.32.0.
	 * They are no longer actively developed and won't receive new features or improvements, only important bug fixes. They will only remain in the
	 * SAPUI5 distribution for backward compatibility.
	 *
	 * <b>SAP strongly recommends that existing consumers of those controls migrate to the new {@link sap.viz.ui5.controls.VizFrame VizFrame}
	 * control to benefit from new charting enhancements and timely support. </b>
	 *
	 * <b>Note</b>: As the feature set, design and API usage of VizFrame might differ from the old chart controls, make sure you evaluate it thoroughly before migration.
	 * @experimental Since version 1.7.2.
	 * Charting API is not finished yet and might change completely.
	 */
	thisLib.ui5.types.Datalabel_paintingMode = {

		/**
		 * Value rectCoordinate
		 * @public
		 */
		rectCoordinate : "rectCoordinate",

		/**
		 * Value polarCoordinate
		 * @public
		 */
		polarCoordinate : "polarCoordinate"
	};
	/** @deprecated Since version 1.32.0. */
	DataType.registerEnum("sap.viz.ui5.types.Datalabel_paintingMode", thisLib.ui5.types.Datalabel_paintingMode);

	/**
	 * List (Enum) type sap.viz.ui5.types.Datalabel_position
	 *
	 * @enum {string}
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.32.0.
	 * The chart controls in the <code>sap.viz.ui5</code> package (which were always marked as <i>experimental</i>) have been deprecated since 1.32.0.
	 * They are no longer actively developed and won't receive new features or improvements, only important bug fixes. They will only remain in the
	 * SAPUI5 distribution for backward compatibility.
	 *
	 * <b>SAP strongly recommends that existing consumers of those controls migrate to the new {@link sap.viz.ui5.controls.VizFrame VizFrame}
	 * control to benefit from new charting enhancements and timely support. </b>
	 *
	 * <b>Note</b>: As the feature set, design and API usage of VizFrame might differ from the old chart controls, make sure you evaluate it thoroughly before migration.
	 * @experimental Since version 1.7.2.
	 * Charting API is not finished yet and might change completely.
	 */
	thisLib.ui5.types.Datalabel_position = {

		/**
		 * Value inside
		 * @public
		 */
		inside : "inside",

		/**
		 * Value outside
		 * @public
		 */
		outside : "outside"
	};
	/** @deprecated Since version 1.32.0. */
	DataType.registerEnum("sap.viz.ui5.types.Datalabel_position", thisLib.ui5.types.Datalabel_position);

	/**
	 * List (Enum) type sap.viz.ui5.types.Legend_layout_position
	 *
	 * @enum {string}
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.32.0.
	 * The chart controls in the <code>sap.viz.ui5</code> package (which were always marked as <i>experimental</i>) have been deprecated since 1.32.0.
	 * They are no longer actively developed and won't receive new features or improvements, only important bug fixes. They will only remain in the
	 * SAPUI5 distribution for backward compatibility.
	 *
	 * <b>SAP strongly recommends that existing consumers of those controls migrate to the new {@link sap.viz.ui5.controls.VizFrame VizFrame}
	 * control to benefit from new charting enhancements and timely support. </b>
	 *
	 * <b>Note</b>: As the feature set, design and API usage of VizFrame might differ from the old chart controls, make sure you evaluate it thoroughly before migration.
	 * @experimental Since version 1.7.2.
	 * Charting API is not finished yet and might change completely.
	 */
	thisLib.ui5.types.Legend_layout_position = {

		/**
		 * Value top
		 * @public
		 */
		top : "top",

		/**
		 * Value bottom
		 * @public
		 */
		bottom : "bottom",

		/**
		 * Value right
		 * @public
		 */
		right : "right",

		/**
		 * Value left
		 * @public
		 */
		left : "left"
	};
	/** @deprecated Since version 1.32.0. */
	DataType.registerEnum("sap.viz.ui5.types.Legend_layout_position", thisLib.ui5.types.Legend_layout_position);

	/**
	 * List (Enum) type sap.viz.ui5.types.Line_drawingEffect
	 *
	 * @enum {string}
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.32.0.
	 * The chart controls in the <code>sap.viz.ui5</code> package (which were always marked as <i>experimental</i>) have been deprecated since 1.32.0.
	 * They are no longer actively developed and won't receive new features or improvements, only important bug fixes. They will only remain in the
	 * SAPUI5 distribution for backward compatibility.
	 *
	 * <b>SAP strongly recommends that existing consumers of those controls migrate to the new {@link sap.viz.ui5.controls.VizFrame VizFrame}
	 * control to benefit from new charting enhancements and timely support. </b>
	 *
	 * <b>Note</b>: As the feature set, design and API usage of VizFrame might differ from the old chart controls, make sure you evaluate it thoroughly before migration.
	 * @experimental Since version 1.7.2.
	 * Charting API is not finished yet and might change completely.
	 */
	thisLib.ui5.types.Line_drawingEffect = {

		/**
		 * Value normal
		 * @public
		 */
		normal : "normal",

		/**
		 * Value glossy
		 * @public
		 */
		glossy : "glossy"
	};
	/** @deprecated Since version 1.32.0. */
	DataType.registerEnum("sap.viz.ui5.types.Line_drawingEffect", thisLib.ui5.types.Line_drawingEffect);

	/**
	 * List (Enum) type sap.viz.ui5.types.Line_marker_shape
	 *
	 * @enum {string}
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.32.0.
	 * The chart controls in the <code>sap.viz.ui5</code> package (which were always marked as <i>experimental</i>) have been deprecated since 1.32.0.
	 * They are no longer actively developed and won't receive new features or improvements, only important bug fixes. They will only remain in the
	 * SAPUI5 distribution for backward compatibility.
	 *
	 * <b>SAP strongly recommends that existing consumers of those controls migrate to the new {@link sap.viz.ui5.controls.VizFrame VizFrame}
	 * control to benefit from new charting enhancements and timely support. </b>
	 *
	 * <b>Note</b>: As the feature set, design and API usage of VizFrame might differ from the old chart controls, make sure you evaluate it thoroughly before migration.
	 * @experimental Since version 1.7.2.
	 * Charting API is not finished yet and might change completely.
	 */
	thisLib.ui5.types.Line_marker_shape = {

		/**
		 * Value circle
		 * @public
		 */
		circle : "circle",

		/**
		 * Value diamond
		 * @public
		 */
		diamond : "diamond",

		/**
		 * Value triangleUp
		 * @public
		 */
		triangleUp : "triangleUp",

		/**
		 * Value triangleDown
		 * @public
		 */
		triangleDown : "triangleDown",

		/**
		 * Value triangleLeft
		 * @public
		 */
		triangleLeft : "triangleLeft",

		/**
		 * Value triangleRight
		 * @public
		 */
		triangleRight : "triangleRight",

		/**
		 * Value cross
		 * @public
		 */
		cross : "cross",

		/**
		 * Value intersection
		 * @public
		 */
		intersection : "intersection"
	};
	/** @deprecated Since version 1.32.0. */
	DataType.registerEnum("sap.viz.ui5.types.Line_marker_shape", thisLib.ui5.types.Line_marker_shape);

	/**
	 * List (Enum) type sap.viz.ui5.types.Line_orientation
	 *
	 * @enum {string}
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.32.0.
	 * The chart controls in the <code>sap.viz.ui5</code> package (which were always marked as <i>experimental</i>) have been deprecated since 1.32.0.
	 * They are no longer actively developed and won't receive new features or improvements, only important bug fixes. They will only remain in the
	 * SAPUI5 distribution for backward compatibility.
	 *
	 * <b>SAP strongly recommends that existing consumers of those controls migrate to the new {@link sap.viz.ui5.controls.VizFrame VizFrame}
	 * control to benefit from new charting enhancements and timely support. </b>
	 *
	 * <b>Note</b>: As the feature set, design and API usage of VizFrame might differ from the old chart controls, make sure you evaluate it thoroughly before migration.
	 * @experimental Since version 1.7.2.
	 * Charting API is not finished yet and might change completely.
	 */
	thisLib.ui5.types.Line_orientation = {

		/**
		 * Value horizontal
		 * @public
		 */
		horizontal : "horizontal",

		/**
		 * Value vertical
		 * @public
		 */
		vertical : "vertical"
	};
	/** @deprecated Since version 1.32.0. */
	DataType.registerEnum("sap.viz.ui5.types.Line_orientation", thisLib.ui5.types.Line_orientation);

	/**
	 * List (Enum) type sap.viz.ui5.types.Pie_drawingEffect
	 *
	 * @enum {string}
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.32.0.
	 * The chart controls in the <code>sap.viz.ui5</code> package (which were always marked as <i>experimental</i>) have been deprecated since 1.32.0.
	 * They are no longer actively developed and won't receive new features or improvements, only important bug fixes. They will only remain in the
	 * SAPUI5 distribution for backward compatibility.
	 *
	 * <b>SAP strongly recommends that existing consumers of those controls migrate to the new {@link sap.viz.ui5.controls.VizFrame VizFrame}
	 * control to benefit from new charting enhancements and timely support. </b>
	 *
	 * <b>Note</b>: As the feature set, design and API usage of VizFrame might differ from the old chart controls, make sure you evaluate it thoroughly before migration.
	 * @experimental Since version 1.7.2.
	 * Charting API is not finished yet and might change completely.
	 */
	thisLib.ui5.types.Pie_drawingEffect = {

		/**
		 * Value normal
		 * @public
		 */
		normal : "normal",

		/**
		 * Value glossy
		 * @public
		 */
		glossy : "glossy"
	};
	/** @deprecated Since version 1.32.0. */
	DataType.registerEnum("sap.viz.ui5.types.Pie_drawingEffect", thisLib.ui5.types.Pie_drawingEffect);

	/**
	 * List (Enum) type sap.viz.ui5.types.Pie_valign
	 *
	 * @enum {string}
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.32.0.
	 * The chart controls in the <code>sap.viz.ui5</code> package (which were always marked as <i>experimental</i>) have been deprecated since 1.32.0.
	 * They are no longer actively developed and won't receive new features or improvements, only important bug fixes. They will only remain in the
	 * SAPUI5 distribution for backward compatibility.
	 *
	 * <b>SAP strongly recommends that existing consumers of those controls migrate to the new {@link sap.viz.ui5.controls.VizFrame VizFrame}
	 * control to benefit from new charting enhancements and timely support. </b>
	 *
	 * <b>Note</b>: As the feature set, design and API usage of VizFrame might differ from the old chart controls, make sure you evaluate it thoroughly before migration.
	 * @experimental Since version 1.7.2.
	 * Charting API is not finished yet and might change completely.
	 */
	thisLib.ui5.types.Pie_valign = {

		/**
		 * Value top
		 * @public
		 */
		top : "top",

		/**
		 * Value center
		 * @public
		 */
		center : "center"
	};
	/** @deprecated Since version 1.32.0. */
	DataType.registerEnum("sap.viz.ui5.types.Pie_valign", thisLib.ui5.types.Pie_valign);

	/**
	 * List (Enum) type sap.viz.ui5.types.Scatter_drawingEffect
	 *
	 * @enum {string}
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.32.0.
	 * The chart controls in the <code>sap.viz.ui5</code> package (which were always marked as <i>experimental</i>) have been deprecated since 1.32.0.
	 * They are no longer actively developed and won't receive new features or improvements, only important bug fixes. They will only remain in the
	 * SAPUI5 distribution for backward compatibility.
	 *
	 * <b>SAP strongly recommends that existing consumers of those controls migrate to the new {@link sap.viz.ui5.controls.VizFrame VizFrame}
	 * control to benefit from new charting enhancements and timely support. </b>
	 *
	 * <b>Note</b>: As the feature set, design and API usage of VizFrame might differ from the old chart controls, make sure you evaluate it thoroughly before migration.
	 * @experimental Since version 1.7.2.
	 * Charting API is not finished yet and might change completely.
	 */
	thisLib.ui5.types.Scatter_drawingEffect = {

		/**
		 * Value normal
		 * @public
		 */
		normal : "normal",

		/**
		 * Value glossy
		 * @public
		 */
		glossy : "glossy"
	};
	/** @deprecated Since version 1.32.0. */
	DataType.registerEnum("sap.viz.ui5.types.Scatter_drawingEffect", thisLib.ui5.types.Scatter_drawingEffect);

	/**
	 * List (Enum) type sap.viz.ui5.types.StackedVerticalBar_drawingEffect
	 *
	 * @enum {string}
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.32.0.
	 * The chart controls in the <code>sap.viz.ui5</code> package (which were always marked as <i>experimental</i>) have been deprecated since 1.32.0.
	 * They are no longer actively developed and won't receive new features or improvements, only important bug fixes. They will only remain in the
	 * SAPUI5 distribution for backward compatibility.
	 *
	 * <b>SAP strongly recommends that existing consumers of those controls migrate to the new {@link sap.viz.ui5.controls.VizFrame VizFrame}
	 * control to benefit from new charting enhancements and timely support. </b>
	 *
	 * <b>Note</b>: As the feature set, design and API usage of VizFrame might differ from the old chart controls, make sure you evaluate it thoroughly before migration.
	 * @experimental Since version 1.7.2.
	 * Charting API is not finished yet and might change completely.
	 */
	thisLib.ui5.types.StackedVerticalBar_drawingEffect = {

		/**
		 * Value normal
		 * @public
		 */
		normal : "normal",

		/**
		 * Value glossy
		 * @public
		 */
		glossy : "glossy"
	};
	/** @deprecated Since version 1.32.0. */
	DataType.registerEnum("sap.viz.ui5.types.StackedVerticalBar_drawingEffect", thisLib.ui5.types.StackedVerticalBar_drawingEffect);

	/**
	 * List (Enum) type sap.viz.ui5.types.StackedVerticalBar_mode
	 *
	 * @enum {string}
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.32.0.
	 * The chart controls in the <code>sap.viz.ui5</code> package (which were always marked as <i>experimental</i>) have been deprecated since 1.32.0.
	 * They are no longer actively developed and won't receive new features or improvements, only important bug fixes. They will only remain in the
	 * SAPUI5 distribution for backward compatibility.
	 *
	 * <b>SAP strongly recommends that existing consumers of those controls migrate to the new {@link sap.viz.ui5.controls.VizFrame VizFrame}
	 * control to benefit from new charting enhancements and timely support. </b>
	 *
	 * <b>Note</b>: As the feature set, design and API usage of VizFrame might differ from the old chart controls, make sure you evaluate it thoroughly before migration.
	 * @experimental Since version 1.7.2.
	 * Charting API is not finished yet and might change completely.
	 */
	thisLib.ui5.types.StackedVerticalBar_mode = {

		/**
		 * Value comparison
		 * @public
		 */
		comparison : "comparison",

		/**
		 * Value percentage
		 * @public
		 */
		percentage : "percentage"
	};
	/** @deprecated Since version 1.32.0. */
	DataType.registerEnum("sap.viz.ui5.types.StackedVerticalBar_mode", thisLib.ui5.types.StackedVerticalBar_mode);

	/**
	 * List (Enum) type sap.viz.ui5.types.StackedVerticalBar_orientation
	 *
	 * @enum {string}
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.32.0.
	 * The chart controls in the <code>sap.viz.ui5</code> package (which were always marked as <i>experimental</i>) have been deprecated since 1.32.0.
	 * They are no longer actively developed and won't receive new features or improvements, only important bug fixes. They will only remain in the
	 * SAPUI5 distribution for backward compatibility.
	 *
	 * <b>SAP strongly recommends that existing consumers of those controls migrate to the new {@link sap.viz.ui5.controls.VizFrame VizFrame}
	 * control to benefit from new charting enhancements and timely support. </b>
	 *
	 * <b>Note</b>: As the feature set, design and API usage of VizFrame might differ from the old chart controls, make sure you evaluate it thoroughly before migration.
	 * @experimental Since version 1.7.2.
	 * Charting API is not finished yet and might change completely.
	 */
	thisLib.ui5.types.StackedVerticalBar_orientation = {

		/**
		 * Value horizontal
		 * @public
		 */
		horizontal : "horizontal",

		/**
		 * Value vertical
		 * @public
		 */
		vertical : "vertical"
	};
	/** @deprecated Since version 1.32.0. */
	DataType.registerEnum("sap.viz.ui5.types.StackedVerticalBar_orientation", thisLib.ui5.types.StackedVerticalBar_orientation);

	/**
	 * List (Enum) type sap.viz.ui5.types.Title_alignment
	 *
	 * @enum {string}
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.32.0.
	 * The chart controls in the <code>sap.viz.ui5</code> package (which were always marked as <i>experimental</i>) have been deprecated since 1.32.0.
	 * They are no longer actively developed and won't receive new features or improvements, only important bug fixes. They will only remain in the
	 * SAPUI5 distribution for backward compatibility.
	 *
	 * <b>SAP strongly recommends that existing consumers of those controls migrate to the new {@link sap.viz.ui5.controls.VizFrame VizFrame}
	 * control to benefit from new charting enhancements and timely support. </b>
	 *
	 * <b>Note</b>: As the feature set, design and API usage of VizFrame might differ from the old chart controls, make sure you evaluate it thoroughly before migration.
	 * @experimental Since version 1.7.2.
	 * Charting API is not finished yet and might change completely.
	 */
	thisLib.ui5.types.Title_alignment = {

		/**
		 * Value left
		 * @public
		 */
		left : "left",

		/**
		 * Value center
		 * @public
		 */
		center : "center",

		/**
		 * Value right
		 * @public
		 */
		right : "right"
	};
	/** @deprecated Since version 1.32.0. */
	DataType.registerEnum("sap.viz.ui5.types.Title_alignment", thisLib.ui5.types.Title_alignment);

	/**
	 * List (Enum) type sap.viz.ui5.types.Tooltip_drawingEffect
	 *
	 * @enum {string}
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.32.0.
	 * The chart controls in the <code>sap.viz.ui5</code> package (which were always marked as <i>experimental</i>) have been deprecated since 1.32.0.
	 * They are no longer actively developed and won't receive new features or improvements, only important bug fixes. They will only remain in the
	 * SAPUI5 distribution for backward compatibility.
	 *
	 * <b>SAP strongly recommends that existing consumers of those controls migrate to the new {@link sap.viz.ui5.controls.VizFrame VizFrame}
	 * control to benefit from new charting enhancements and timely support. </b>
	 *
	 * <b>Note</b>: As the feature set, design and API usage of VizFrame might differ from the old chart controls, make sure you evaluate it thoroughly before migration.
	 * @experimental Since version 1.7.2.
	 * Charting API is not finished yet and might change completely.
	 */
	thisLib.ui5.types.Tooltip_drawingEffect = {

		/**
		 * Value normal
		 * @public
		 */
		normal : "normal",

		/**
		 * Value glossy
		 * @public
		 */
		glossy : "glossy"
	};
	/** @deprecated Since version 1.32.0. */
	DataType.registerEnum("sap.viz.ui5.types.Tooltip_drawingEffect", thisLib.ui5.types.Tooltip_drawingEffect);

	/**
	 * List (Enum) type sap.viz.ui5.types.VerticalBar_drawingEffect
	 *
	 * @enum {string}
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.32.0.
	 * The chart controls in the <code>sap.viz.ui5</code> package (which were always marked as <i>experimental</i>) have been deprecated since 1.32.0.
	 * They are no longer actively developed and won't receive new features or improvements, only important bug fixes. They will only remain in the
	 * SAPUI5 distribution for backward compatibility.
	 *
	 * <b>SAP strongly recommends that existing consumers of those controls migrate to the new {@link sap.viz.ui5.controls.VizFrame VizFrame}
	 * control to benefit from new charting enhancements and timely support. </b>
	 *
	 * <b>Note</b>: As the feature set, design and API usage of VizFrame might differ from the old chart controls, make sure you evaluate it thoroughly before migration.
	 * @experimental Since version 1.7.2.
	 * Charting API is not finished yet and might change completely.
	 */
	thisLib.ui5.types.VerticalBar_drawingEffect = {

		/**
		 * Value normal
		 * @public
		 */
		normal : "normal",

		/**
		 * Value glossy
		 * @public
		 */
		glossy : "glossy"
	};
	/** @deprecated Since version 1.32.0. */
	DataType.registerEnum("sap.viz.ui5.types.VerticalBar_drawingEffect", thisLib.ui5.types.VerticalBar_drawingEffect);

	/**
	 * List (Enum) type sap.viz.ui5.types.VerticalBar_orientation
	 *
	 * @enum {string}
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.32.0.
	 * The chart controls in the <code>sap.viz.ui5</code> package (which were always marked as <i>experimental</i>) have been deprecated since 1.32.0.
	 * They are no longer actively developed and won't receive new features or improvements, only important bug fixes. They will only remain in the
	 * SAPUI5 distribution for backward compatibility.
	 *
	 * <b>SAP strongly recommends that existing consumers of those controls migrate to the new {@link sap.viz.ui5.controls.VizFrame VizFrame}
	 * control to benefit from new charting enhancements and timely support. </b>
	 *
	 * <b>Note</b>: As the feature set, design and API usage of VizFrame might differ from the old chart controls, make sure you evaluate it thoroughly before migration.
	 * @experimental Since version 1.7.2.
	 * Charting API is not finished yet and might change completely.
	 */
	thisLib.ui5.types.VerticalBar_orientation = {

		/**
		 * Value horizontal
		 * @public
		 */
		horizontal : "horizontal",

		/**
		 * Value vertical
		 * @public
		 */
		vertical : "vertical"
	};
	/** @deprecated Since version 1.32.0. */
	DataType.registerEnum("sap.viz.ui5.types.VerticalBar_orientation", thisLib.ui5.types.VerticalBar_orientation);

	/**
	 * List (Enum) type sap.viz.ui5.types.controller.Interaction_pan_orientation
	 *
	 * @enum {string}
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.32.0.
	 * The chart controls in the <code>sap.viz.ui5</code> package (which were always marked as <i>experimental</i>) have been deprecated since 1.32.0.
	 * They are no longer actively developed and won't receive new features or improvements, only important bug fixes. They will only remain in the
	 * SAPUI5 distribution for backward compatibility.
	 *
	 * <b>SAP strongly recommends that existing consumers of those controls migrate to the new {@link sap.viz.ui5.controls.VizFrame VizFrame}
	 * control to benefit from new charting enhancements and timely support. </b>
	 *
	 * <b>Note</b>: As the feature set, design and API usage of VizFrame might differ from the old chart controls, make sure you evaluate it thoroughly before migration.
	 * @experimental Since version 1.7.2.
	 * Charting API is not finished yet and might change completely.
	 */
	thisLib.ui5.types.controller.Interaction_pan_orientation = {

		/**
		 * Value horizontal
		 * @public
		 */
		horizontal : "horizontal",

		/**
		 * Value vertical
		 * @public
		 */
		vertical : "vertical",

		/**
		 * Value both
		 * @public
		 */
		both : "both"
	};
	/** @deprecated Since version 1.32.0. */
	DataType.registerEnum("sap.viz.ui5.types.controller.Interaction_pan_orientation", thisLib.ui5.types.controller.Interaction_pan_orientation);

	/**
	 * List (Enum) type sap.viz.ui5.types.controller.Interaction_selectability_mode
	 *
	 * @enum {string}
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.32.0.
	 * The chart controls in the <code>sap.viz.ui5</code> package (which were always marked as <i>experimental</i>) have been deprecated since 1.32.0.
	 * They are no longer actively developed and won't receive new features or improvements, only important bug fixes. They will only remain in the
	 * SAPUI5 distribution for backward compatibility.
	 *
	 * <b>SAP strongly recommends that existing consumers of those controls migrate to the new {@link sap.viz.ui5.controls.VizFrame VizFrame}
	 * control to benefit from new charting enhancements and timely support. </b>
	 *
	 * <b>Note</b>: As the feature set, design and API usage of VizFrame might differ from the old chart controls, make sure you evaluate it thoroughly before migration.
	 * @experimental Since version 1.7.2.
	 * Charting API is not finished yet and might change completely.
	 */
	thisLib.ui5.types.controller.Interaction_selectability_mode = {

		/**
		 * Value exclusive
		 * @public
		 */
		exclusive : "exclusive",

		/**
		 * Value inclusive
		 * @public
		 */
		inclusive : "inclusive",

		/**
		 * Value single
		 * @public
		 */
		single : "single",

		/**
		 * Value multiple
		 * @public
		 */
		multiple : "multiple",

		/**
		 * Value none
		 * @public
		 */
		none : "none"
	};
	/** @deprecated Since version 1.32.0. */
	DataType.registerEnum("sap.viz.ui5.types.controller.Interaction_selectability_mode", thisLib.ui5.types.controller.Interaction_selectability_mode);

	/**
	 * List (Enum) type sap.viz.ui5.types.legend.Common_alignment
	 *
	 * @enum {string}
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.32.0.
	 * The chart controls in the <code>sap.viz.ui5</code> package (which were always marked as <i>experimental</i>) have been deprecated since 1.32.0.
	 * They are no longer actively developed and won't receive new features or improvements, only important bug fixes. They will only remain in the
	 * SAPUI5 distribution for backward compatibility.
	 *
	 * <b>SAP strongly recommends that existing consumers of those controls migrate to the new {@link sap.viz.ui5.controls.VizFrame VizFrame}
	 * control to benefit from new charting enhancements and timely support. </b>
	 *
	 * <b>Note</b>: As the feature set, design and API usage of VizFrame might differ from the old chart controls, make sure you evaluate it thoroughly before migration.
	 * @experimental Since version 1.7.2.
	 * Charting API is not finished yet and might change completely.
	 */
	thisLib.ui5.types.legend.Common_alignment = {

		/**
		 * Value start
		 * @public
		 */
		start : "start",

		/**
		 * Value middle
		 * @public
		 */
		middle : "middle",

		/**
		 * Value end
		 * @public
		 */
		end : "end"
	};
	/** @deprecated Since version 1.32.0. */
	DataType.registerEnum("sap.viz.ui5.types.legend.Common_alignment", thisLib.ui5.types.legend.Common_alignment);

	/**
	 * List (Enum) type sap.viz.ui5.types.legend.Common_drawingEffect
	 *
	 * @enum {string}
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.32.0.
	 * The chart controls in the <code>sap.viz.ui5</code> package (which were always marked as <i>experimental</i>) have been deprecated since 1.32.0.
	 * They are no longer actively developed and won't receive new features or improvements, only important bug fixes. They will only remain in the
	 * SAPUI5 distribution for backward compatibility.
	 *
	 * <b>SAP strongly recommends that existing consumers of those controls migrate to the new {@link sap.viz.ui5.controls.VizFrame VizFrame}
	 * control to benefit from new charting enhancements and timely support. </b>
	 *
	 * <b>Note</b>: As the feature set, design and API usage of VizFrame might differ from the old chart controls, make sure you evaluate it thoroughly before migration.
	 * @experimental Since version 1.7.2.
	 * Charting API is not finished yet and might change completely.
	 */
	thisLib.ui5.types.legend.Common_drawingEffect = {

		/**
		 * Value normal
		 * @public
		 */
		normal : "normal",

		/**
		 * Value glossy
		 * @public
		 */
		glossy : "glossy"
	};
	/** @deprecated Since version 1.32.0. */
	DataType.registerEnum("sap.viz.ui5.types.legend.Common_drawingEffect", thisLib.ui5.types.legend.Common_drawingEffect);

	/**
	 * List (Enum) type sap.viz.ui5.types.legend.Common_position
	 *
	 * @enum {string}
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.32.0.
	 * The chart controls in the <code>sap.viz.ui5</code> package (which were always marked as <i>experimental</i>) have been deprecated since 1.32.0.
	 * They are no longer actively developed and won't receive new features or improvements, only important bug fixes. They will only remain in the
	 * SAPUI5 distribution for backward compatibility.
	 *
	 * <b>SAP strongly recommends that existing consumers of those controls migrate to the new {@link sap.viz.ui5.controls.VizFrame VizFrame}
	 * control to benefit from new charting enhancements and timely support. </b>
	 *
	 * <b>Note</b>: As the feature set, design and API usage of VizFrame might differ from the old chart controls, make sure you evaluate it thoroughly before migration.
	 * @experimental Since version 1.7.2.
	 * Charting API is not finished yet and might change completely.
	 */
	thisLib.ui5.types.legend.Common_position = {

		/**
		 * Value top
		 * @public
		 */
		top : "top",

		/**
		 * Value bottom
		 * @public
		 */
		bottom : "bottom",

		/**
		 * Value right
		 * @public
		 */
		right : "right",

		/**
		 * Value left
		 * @public
		 */
		left : "left"
	};
	/** @deprecated Since version 1.32.0. */
	DataType.registerEnum("sap.viz.ui5.types.legend.Common_position", thisLib.ui5.types.legend.Common_position);

	/**
	 * List (Enum) type sap.viz.ui5.types.legend.Common_type
	 *
	 * @enum {string}
	 * @public
	 * @since 1.7.2
	 * @deprecated Since version 1.32.0.
	 * The chart controls in the <code>sap.viz.ui5</code> package (which were always marked as <i>experimental</i>) have been deprecated since 1.32.0.
	 * They are no longer actively developed and won't receive new features or improvements, only important bug fixes. They will only remain in the
	 * SAPUI5 distribution for backward compatibility.
	 *
	 * <b>SAP strongly recommends that existing consumers of those controls migrate to the new {@link sap.viz.ui5.controls.VizFrame VizFrame}
	 * control to benefit from new charting enhancements and timely support. </b>
	 *
	 * <b>Note</b>: As the feature set, design and API usage of VizFrame might differ from the old chart controls, make sure you evaluate it thoroughly before migration.
	 * @experimental Since version 1.7.2.
	 * Charting API is not finished yet and might change completely.
	 */
	thisLib.ui5.types.legend.Common_type = {

		/**
		 * Value ColorLegend
		 * @public
		 */
		ColorLegend : "ColorLegend",

		/**
		 * Value BubbleColorLegend
		 * @public
		 */
		BubbleColorLegend : "BubbleColorLegend",

		/**
		 * Value SizeLegend
		 * @public
		 */
		SizeLegend : "SizeLegend",

		/**
		 * Value MeasureBasedColoringLegend
		 * @public
		 */
		MeasureBasedColoringLegend : "MeasureBasedColoringLegend"
	};
	/** @deprecated Since version 1.32.0. */
	DataType.registerEnum("sap.viz.ui5.types.legend.Common_type", thisLib.ui5.types.legend.Common_type);


	//@@end generated-enums

	// check whether browser supports svg
	thisLib.__svg_support = !!document.createElementNS && !!document.createElementNS("http://www.w3.org/2000/svg", "svg").createSVGRect;

	//  We used to load "css" plugin for requirejs In sap-viz-info-framework.js. Now requirejs is loaded after sap-viz-info-framework.js,
	//  and we have to define "css" plugin here.
	if (window.define) {
		window.define("css", new CssPlugin());
	}

	/**
	 * The function declaration for initLegacySupport() and its only call converted to an immediately invoked function expression (IIFE).
 	 * @deprecated
 	 */
	(function() {
		var LEGACY_NAMES = {
			"sap.viz.core.BaseChart" : "sap.viz.ui5.core.BaseChart",
			"sap.viz.core.BaseStructuredType" : "sap.viz.ui5.core.BaseStructuredType",
			"sap.viz.core.Dataset" : "sap.viz.ui5.data.Dataset",
			"sap.viz.core.DimensionDefinition" : "sap.viz.ui5.data.DimensionDefinition",
			"sap.viz.core.FlattenedDataset" : "sap.viz.ui5.data.FlattenedDataset",
			"sap.viz.core.MeasureDefinition" : "sap.viz.ui5.data.MeasureDefinition",
			"sap.viz.Bar" : "sap.viz.ui5.Bar",
			"sap.viz.Bubble" : "sap.viz.ui5.Bubble",
			"sap.viz.VerticalBar" : "sap.viz.ui5.Column",
			"sap.viz.Combination" : "sap.viz.ui5.Combination",
			"sap.viz.Donut" : "sap.viz.ui5.Donut",
			"sap.viz.Line" : "sap.viz.ui5.Line",
			"sap.viz.Pie" : "sap.viz.ui5.Pie",
			"sap.viz.Scatter" : "sap.viz.ui5.Scatter",
			"sap.viz.StackedVerticalBar" : "sap.viz.ui5.StackedColumn",
			"sap.viz.PercentageStackedVerticalBar" : "sap.viz.ui5.StackedColumn100"
		};

		// create stubs for the most important legacy class names
		jQuery.each(LEGACY_NAMES, function(sOld, sNew) {
			// delegate constructor
			ObjectPath.set(sOld, function() {
				Log.warning("[Deprecated] chart '" + sOld + "' has been deprecated for several releases and will be removed soon. Use '" + sNew + "' instead.");
				var oNewClass = ObjectPath.get(sNew || "");
				var oInstance = Object.create(oNewClass.prototype || null);
				return oNewClass.apply(oInstance, arguments) || oInstance;
			});
			// delegate extend
			ObjectPath.set(sOld + ".extend", function() {
				Log.warning("[Deprecated] chart '" + sOld + "' has been deprecated for several releases and will be removed soon. Use '" + sNew + "' instead.");
				return	ObjectPath.get(sNew || "").extend.apply(this, arguments);
			});

			// delegate getMetadata
			ObjectPath.set(sOld + ".getMetadata", function() {
				Log.warning("[Deprecated] chart '" + sOld + "' has been deprecated for several releases and will be removed soon. Use '" + sNew + "' instead.");
				return	ObjectPath.get(sNew || "").getMetadata.apply(this, arguments);
			});
		});

		// create stubs for the enum types (static classes)
		var oLibrary = sap.ui.getCore().getLoadedLibraries()["sap.viz"];
		if (oLibrary && oLibrary.types) {
			oLibrary.types.forEach(function(sName) {
				if (sName.indexOf("sap.viz.ui5.types.") === 0) {
					ObjectPath.set("sap.viz.types." + sName.slice("sap.viz.ui5.types.".length), ObjectPath.get(sName || ""));
				}
			});
		}
	}());

	var bChartResourceRequested = false;
	var vizContainerInfo = {
		// unloaded, loading, loaded
		'status' : 'unloaded'
	};

	/*
	 * For Viz Chart, it only needs to load chart resources.
	 */
	thisLib._initializeVIZ = function() {
		if (!thisLib.__svg_support) {
			return;
		}
		if (bChartResourceRequested) {
			return;
		}
		// Load chart resources only
		thisLib._initializeENV(true);
		bChartResourceRequested = true;
	};

	/*
	 * For VizContainer, both chart and vizContainer resource should be loaded.
	 */
	thisLib._initializeVIZControls = function(isVizContainer, callback) {
		if (!thisLib.__svg_support) {
			callback(false);
		}
		if (vizContainerInfo.status === 'unloaded') {
			vizContainerInfo.callbacks = [callback];
			vizContainerInfo.status = 'loading';
			// Load
			thisLib._initializeENV(!bChartResourceRequested, isVizContainer ? 'container' : 'controls', function() {
				vizContainerInfo.status = 'loaded';
				if (vizContainerInfo && vizContainerInfo.callbacks) {
					for (var i = 0; i < vizContainerInfo.callbacks.length; i++) {
						vizContainerInfo.callbacks[i](true);
					}
					delete vizContainerInfo.callbacks;
				}
			});
			// Update status
			bChartResourceRequested = true;
		} else if (vizContainerInfo.status === 'loading') {
			vizContainerInfo.callbacks.push(callback);
		} else if (vizContainerInfo.status === 'loaded') {
			callback(true);
		}
	};

	/*
	 * Initialize the environment settings.
	 */
	thisLib._initializeENV = function(bLoadChartResouce, pathVizControls, callback) {
		// Initialize the path
		var sPaths = sap.viz.api.env.Resource.path("sap.viz.api.env.Language.loadPaths") || [];
		if (bLoadChartResouce) {
			// Override the build in path for chart
			sPaths = [];
			sPaths.push(sap.ui.require.toUrl("sap/viz/resources/chart/langs") + "/");
			sPaths.push(sap.ui.require.toUrl("sap/viz/resources/framework/langs") + "/");
		}
		if (pathVizControls === 'container') {
			sPaths.push(sap.ui.require.toUrl("sap/viz/ui5/container/libs/locale") + "/");
		} else if (pathVizControls === 'controls') {
			sPaths.push(sap.ui.require.toUrl("sap/viz/ui5/controls/libs/sap-viz-vizframe/resources/locale") + "/");
		}
		var treatAsMobile = "auto";
		if (Device.system.desktop === true) {
			treatAsMobile = "off";
		} else if (Device.system.desktop === false) {
			treatAsMobile = "on";
		}
		sap.viz.api.env.globalSettings({"treatAsMobile": treatAsMobile});
		sap.viz.api.env.globalSettings({"UI5Date": UI5Date});
		sap.viz.api.env.globalSettings({"UniversalDate": UniversalDate});
		sap.viz.api.env.globalSettings({"UniversalDateUtils": UniversalDateUtils});
		sap.viz.api.env.globalSettings({"CalendarWeekNumbering": CalendarWeekNumbering});
		sap.viz.api.env.globalSettings({"CalendarUtils": CalendarUtils});
		sap.viz.api.env.globalSettings({"Formatting": Formatting});
		sap.viz.api.env.globalSettings({"TimezoneUtil": TimezoneUtil});
		sap.viz.api.env.globalSettings({"Localization": Localization});
		// Load
		if (sPaths.length > 0) {
			if (pathVizControls) {
				// Format
				sap.viz.api.env.Format.useDefaultFormatter(true);
				sap.viz.api.env.globalSettings({"useLatestFormatPrefix":true});
			}
			// Resource path
			sap.viz.api.env.Resource.path("sap.viz.api.env.Language.loadPaths", sPaths);
			Log.info("VIZ: load path for lang manager set to " + sPaths);
			// Default assets root
			if (pathVizControls) {
				if (pathVizControls === 'container') {
					var GlobalConfig = sap.viz.controls.common.config.GlobalConfig;
					GlobalConfig.defaultAssetsRoot(sap.ui.require.toUrl("sap/viz/ui5/container/libs") + "/");
				}
			}
			// Theme
			if (pathVizControls) {
				sap.viz.api.env.Resource.path("sap.viz.api.env.Template.loadPaths", [sap.ui.require.toUrl("sap/viz/resources/chart/templates") + "/"]);
				Theming.attachApplied(function(evt) {
					thisLib._applyTheme();
				});
				thisLib._applyTheme();
			}
			thisLib._applyLocale(callback);
		}
	};

	thisLib._applyTheme = function() {
		// Set template to viz
		thisLib._changeTemplate('standard_fiori');
		var colorArray = [
		// Qualitative color
		'sapUiChartPaletteQualitativeHue1',
		'sapUiChartPaletteQualitativeHue2',
		'sapUiChartPaletteQualitativeHue3',
		'sapUiChartPaletteQualitativeHue4',
		'sapUiChartPaletteQualitativeHue5',
		'sapUiChartPaletteQualitativeHue6',
		'sapUiChartPaletteQualitativeHue7',
		'sapUiChartPaletteQualitativeHue8',
		'sapUiChartPaletteQualitativeHue9',
		'sapUiChartPaletteQualitativeHue10',
		'sapUiChartPaletteQualitativeHue11',
		'sapUiChartPaletteQualitativeHue12',
		'sapUiChartPaletteQualitativeHue13',
		'sapUiChartPaletteQualitativeHue14',
		'sapUiChartPaletteQualitativeHue15',
		'sapUiChartPaletteQualitativeHue16',
		'sapUiChartPaletteQualitativeHue17',
		'sapUiChartPaletteQualitativeHue18',
		'sapUiChartPaletteQualitativeHue19',
		'sapUiChartPaletteQualitativeHue20',
		'sapUiChartPaletteQualitativeHue21',
		'sapUiChartPaletteQualitativeHue22',
		// Semantic color
		'sapUiChartPaletteSemanticBadLight3',
		'sapUiChartPaletteSemanticBadLight2',
		'sapUiChartPaletteSemanticBadLight1',
		'sapUiChartPaletteSemanticBad',
		'sapUiChartPaletteSemanticBadDark1',
		'sapUiChartPaletteSemanticBadDark2',
		'sapUiChartPaletteSemanticCriticalLight3',
		'sapUiChartPaletteSemanticCriticalLight2',
		'sapUiChartPaletteSemanticCriticalLight1',
		'sapUiChartPaletteSemanticCritical',
		'sapUiChartPaletteSemanticCriticalDark1',
		'sapUiChartPaletteSemanticCriticalDark2',
		'sapUiChartPaletteSemanticGoodLight3',
		'sapUiChartPaletteSemanticGoodLight2',
		'sapUiChartPaletteSemanticGoodLight1',
		'sapUiChartPaletteSemanticGood',
		'sapUiChartPaletteSemanticGoodDark1',
		'sapUiChartPaletteSemanticGoodDark2',
		'sapUiChartPaletteSemanticNeutralLight3',
		'sapUiChartPaletteSemanticNeutralLight2',
		'sapUiChartPaletteSemanticNeutralLight1',
		'sapUiChartPaletteSemanticNeutral',
		'sapUiChartPaletteSemanticNeutralDark1',
		'sapUiChartPaletteSemanticNeutralDark2',
		'sapUiChartPaletteNoSemDiv1Dark2',
		'sapUiChartPaletteNoSemDiv1Dark1',
		'sapUiChartPaletteNoSemDiv1',
		'sapUiChartPaletteNoSemDiv1Light1',
		'sapUiChartPaletteNoSemDiv1Light2',
		'sapUiChartPaletteNoSemDiv1Light3',
		// Sequential color
		'sapUiChartPaletteSequentialHue1Light3',
		'sapUiChartPaletteSequentialHue1Light2',
		'sapUiChartPaletteSequentialHue1Light1',
		'sapUiChartPaletteSequentialHue1',
		'sapUiChartPaletteSequentialHue1Dark1',
		'sapUiChartPaletteSequentialHue1Dark2',
		'sapUiChartPaletteSequentialHue2Light3',
		'sapUiChartPaletteSequentialHue2Light2',
		'sapUiChartPaletteSequentialHue2Light1',
		'sapUiChartPaletteSequentialHue2',
		'sapUiChartPaletteSequentialHue2Dark1',
		'sapUiChartPaletteSequentialHue2Dark2',
		'sapUiChartPaletteSequentialHue3Light3',
		'sapUiChartPaletteSequentialHue3Light2',
		'sapUiChartPaletteSequentialHue3Light1',
		'sapUiChartPaletteSequentialHue3',
		'sapUiChartPaletteSequentialHue3Dark1',
		'sapUiChartPaletteSequentialHue3Dark2',
		'sapUiChartPaletteSequentialHue6Light3',
		'sapUiChartPaletteSequentialHue6Light2',
		'sapUiChartPaletteSequentialHue6Light1',
		'sapUiChartPaletteSequentialHue6',
		'sapUiChartPaletteSequentialHue6Dark1',
		'sapUiChartPaletteSequentialHue6Dark2',
		'sapUiChartPaletteSequentialNeutralLight3',
		'sapUiChartPaletteSequentialNeutralLight2',
		'sapUiChartPaletteSequentialNeutralLight1',
		'sapUiChartPaletteSequentialNeutral',
		'sapUiChartPaletteSequentialNeutralDark1',
		'sapUiChartPaletteSequentialNeutralDark2',
		'sapUiChoroplethRegionBG',
		'sapUiChartZeroAxisColor',
		'sapUiNegativeElement',
		'sapUiCriticalElement',
		'sapUiPositiveElement',
		'sapUiNeutralElement'];
		var mapping = Parameters.get({
			name: colorArray,
			callback: function() {}
		});
		sap.viz.api.env.globalSettings({
			'colorMapping': mapping
		});
	};

	thisLib._changeTemplate = function(template) {
		if (sap.viz.api.env.Template.get() !== template) {
			sap.viz.api.env.Template.set(template);
		}
	};

	thisLib._applyLocale = function(callback) {
		// Get locale from ui5
		var oLocale = Localization.getLanguageTag();
		var sVIZLanguageId = oLocale.language;
		if (sVIZLanguageId === 'zh') {
			sVIZLanguageId = (Localization.getSAPLogonLanguage() === 'ZH') ? 'zh_CN' : 'zh_TW';
		}
		// Set locale to viz
		sap.viz.api.env.Locale.set(sVIZLanguageId, function() {
			if (callback) {
				callback();
			}
		});
		Log.info("VIZ: env initialized (locale=" + Localization.getLanguage() + ")");
	};

	return thisLib;

});
