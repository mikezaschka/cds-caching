/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([
		'./library',
		'sap/suite/ui/microchart/MicroChartRenderUtils',
		'sap/ui/core/theming/Parameters',
		'sap/m/library',
		'sap/ui/thirdparty/jquery'
	],
	function(library, MicroChartRenderUtils, Parameters, mobileLibrary, jQuery) {
	"use strict";

	/** @deprecated since 1.135 */
	var ValueCSSColor = mobileLibrary.ValueCSSColor;

	var DEFAULT_ITEM_COLOR = "sapUiChartNeutral";

	const MicroChartColorType = library.MicroChartColorType;


	/**
	 * ColumnMicroChartRenderer renderer.
	 * @namespace
	 */
	var ColumnMicroChartRenderer = {
		apiVersion : 2 //enable in-place DOM patching
	};

	/**
	 * Renders the HTML for the given control, using the provided
	 * {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRm the RenderManager that can be used for writing to	the Render-Output-Buffer
	 * @param {sap.suite.ui.microchart.ColumnMicroChart} oControl the control to be rendered
	 */
	ColumnMicroChartRenderer.render = function(oRm, oControl) {
		if (!oControl._bThemeApplied) {
			return;
		}

		var bColumnLabels = oControl.getAllowColumnLabels();
		var bAnyBottomColumnLabel = oControl.getColumns().some(function(oColumn) {
			return oColumn.getLabel();
		});

		if (oControl._hasData()) {
			oRm.openStart("div", oControl);
			this._writeMainProperties(oRm, oControl);

			if (bColumnLabels) {
				oRm.class("sapSuiteClMCColumnLabels");
			}

			if (!bAnyBottomColumnLabel) {
				oRm.class("sapSuiteClMCNoBottomColumnLabels");
			}

			oRm.openEnd();

			var bLeftTopLbl = oControl.getLeftTopLabel() && oControl.getLeftTopLabel().getLabel() !== "" && oControl.getShowTopLabels();
			var bRightTopLbl = oControl.getRightTopLabel() && oControl.getRightTopLabel().getLabel() !== "" && oControl.getShowTopLabels();
			var bLeftBtmLbl = oControl.getLeftBottomLabel() && oControl.getLeftBottomLabel().getLabel() !== "" && oControl.getShowBottomLabels();
			var bRightBtmLbl = oControl.getRightBottomLabel() && oControl.getRightBottomLabel().getLabel() !== "" && oControl.getShowBottomLabels();

			oRm.openStart("div");
			oRm.class("sapSuiteClMCVerticalAlignmentContainer");
			oRm.openEnd();

			if (bLeftTopLbl || bRightTopLbl) {
				oRm.openStart("div",oControl.getId() + "-top-lbls");
				oRm.class("sapSuiteClMCLabels");
				oRm.class("sapSuiteClMCPositionTop");
				oRm.openEnd();
				var bWideTopLbl = bLeftTopLbl ^ bRightTopLbl;
				if (bLeftTopLbl) {
					this._writeEdgeLabel(oRm, oControl, oControl.getLeftTopLabel(), "-left-top-lbl", "sapSuiteClMCPositionLeft", bWideTopLbl);
				}

				if (bRightTopLbl) {
					this._writeEdgeLabel(oRm, oControl, oControl.getRightTopLabel(), "-right-top-lbl", "sapSuiteClMCPositionRight", bWideTopLbl);
				}
				oRm.close("div");
			}

			var aColumns = oControl.getColumns();
			var iColumnsNum = aColumns.length;
			var bTopColumnLabels, bBottomColumnLabels;
			var oColumn, fValue, i;

			if (bColumnLabels) {
				for (i = 0; i < iColumnsNum; i++) {
					oColumn = aColumns[i];
					fValue = oColumn.getValue();

					if (fValue && fValue >= 0) {
						bTopColumnLabels = true;
					} else if (fValue && fValue < 0) {
						bBottomColumnLabels = true;
					}

					if (bTopColumnLabels && bBottomColumnLabels) {
						break;
					}
				}
			}

			if (bColumnLabels && bTopColumnLabels) {
				oRm.openStart("div");
				oRm.class("sapSuiteClMCColumnLabelDivider");
				oRm.openEnd();
				oRm.close("div");
			}

			oRm.openStart("div",oControl.getId() + "-bars");
			oRm.class("sapSuiteClMCBars");
			oRm.openEnd();

			for (i = 0; i < iColumnsNum; i++) {
				oColumn = aColumns[i];
				fValue = oColumn.getValue();

				oRm.openStart("div",oColumn);
				oRm.class("sapSuiteClMCBar");

				if (oColumn.hasListeners("press")) {
					oRm.attr("tabindex", "0");
					oRm.attr("role", "presentation");
					var sBarAltText = oControl._getBarAltText(oColumn);
					oRm.attr("title", sBarAltText);
					oRm.attr("aria-label", sBarAltText);
					oRm.class("sapSuiteUiMicroChartPointer");
				}

				oRm.openEnd();

				if (bColumnLabels && Number.isFinite(Number(fValue)) && fValue >= 0) {
					this._writeColumnValueLabel(oRm, oColumn, "sapSuiteClMCLabelColumnTop");
				}

				oRm.openStart("div");
				oRm.class("sapSuiteClMCInnerBar");


				this._setHexColor(oRm, oColumn.getColor(), DEFAULT_ITEM_COLOR, "background-color");

				oRm.openEnd();
				oRm.close("div");

				if (bColumnLabels && Number.isFinite(Number(fValue)) && fValue < 0) {
					this._writeColumnValueLabel(oRm, oColumn, "sapSuiteClMCLabelColumnBottom");
				}

				oRm.close("div");
			}
			oRm.close("div");

			if (bColumnLabels && bBottomColumnLabels) {
				oRm.openStart("div");
				oRm.class("sapSuiteClMCColumnLabelDivider");
				oRm.openEnd();
				oRm.close("div");
			}

			if (bLeftBtmLbl || bRightBtmLbl) {
				oRm.openStart("div",oControl.getId() + "-btm-lbls");
				oRm.class("sapSuiteClMCLabels");
				oRm.class("sapSuiteClMCPositionBtm");
				oRm.openEnd();
				var bWideBtmLbl = bLeftBtmLbl ^ bRightBtmLbl; // XOR

				if (bLeftBtmLbl) {
					this._writeEdgeLabel(oRm, oControl, oControl.getLeftBottomLabel(), "-left-btm-lbl", "sapSuiteClMCPositionLeft", bWideBtmLbl);
				}

				if (bRightBtmLbl) {
					this._writeEdgeLabel(oRm, oControl, oControl.getRightBottomLabel(), "-right-btm-lbl", "sapSuiteClMCPositionRight", bWideBtmLbl);
				}

				oRm.close("div");
			}

			if (bColumnLabels && bAnyBottomColumnLabel) {
				oRm.openStart("div");
				oRm.class("sapSuiteClMCLabels");
				oRm.class("sapSuiteClMCBottomColumnLabels");
				oRm.openEnd();

				aColumns.forEach(function(oColumn) {
					this._writeColumnLabel(oRm, oColumn);
				}, this);

				oRm.close("div");
			}

			oRm.openStart("div", oControl.getId() + "-hidden");
			oRm.attr("aria-hidden", "true");
			oRm.attr("tabindex", "-1");
			oRm.openEnd();
			oRm.close("div");

			oRm.close("div");// end of vertical containment
			oRm.close("div");
		} else {
			this._renderNoData(oRm, oControl);
		}
	};

	/**
	 * Renders control data and prepares default classes and styles
	 *
	 * @param {object} oRm render manager
	 * @param {object} oControl AreaMicroChart control
	 * @private
	 */
	ColumnMicroChartRenderer._writeMainProperties = function(oRm, oControl) {
		var bIsActive = oControl.hasListeners("press");

		this._renderActiveProperties(oRm, oControl);

			var sAriaLabel = oControl.getTooltip_AsString(bIsActive);
			oRm.attr("role", "figure");

		if (oControl.getAriaLabelledBy().length) {
			oRm.accessibilityState(oControl);
		} else {
			oRm.attr("aria-label", sAriaLabel);
		}

		oRm.class("sapSuiteClMC");
		oRm.class("sapSuiteClMCSize" + oControl.getSize());
		oRm.style("width", oControl.getWidth());
		oRm.style("height", oControl.getHeight());
	};

	/**
	* @deprecated As of version 1.135
	*/
	ColumnMicroChartRenderer._getHexColor = function (sColor, sDefaultColor) {
		sColor = ValueCSSColor.isValid(sColor) ? sColor : sDefaultColor;
		return Parameters.get(sColor) || sColor;
	};

	ColumnMicroChartRenderer._setHexColor = function (oRm, sColor, sDefaultColor, sStyle) {
		if (MicroChartColorType.hasOwnProperty(sColor)){
			oRm.class("sapSuiteClMCSemanticColor" + sColor);
		} else if (sStyle !== ''){
			/**
			 * @deprecated As of version 1.135
			 */
			oRm.style(sStyle, this._getHexColor(sColor, sDefaultColor));
		}
	};

	ColumnMicroChartRenderer._writeEdgeLabel = 	function (oRm, oControl, oLabel, sId, sClass, bWideBtmLbl) {
		oRm.openStart("div", oControl.getId() + sId);
		oRm.class("sapSuiteClMCLabel");
		oRm.class("sapSuiteClMCEdgeLabel");
		oRm.class(sClass);

		if (bWideBtmLbl) {
			oRm.class("sapSuiteClMCWideBtmLbl");
		}
		oRm.openEnd();
		oRm.text(oLabel.getLabel());
		oRm.close("div");
	};

	ColumnMicroChartRenderer._writeColumnValueLabel = function (oRm, oColumn, sClass) {
		var sValue = oColumn.getDisplayValue() ? oColumn.getDisplayValue() : oColumn.getValue();

		oRm.openStart("div");
		oRm.class("sapSuiteClMCLabel");
		oRm.class("sapSuiteClMCLabelColumn");
		oRm.class(sClass);
                this._setHexColor(oRm, oColumn.getColor(), DEFAULT_ITEM_COLOR);
		oRm.openEnd();
		oRm.text(sValue);
		oRm.close("div");
	};

	ColumnMicroChartRenderer._writeColumnLabel = function (oRm, oColumn) {
		var sLabel = oColumn.getLabel();

		oRm.openStart("div");
		oRm.class("sapSuiteClMCLabel");
		oRm.class("sapSuiteClMCLabelColumn");
		oRm.class("sapSuiteClMCBottomColumnLabel");
		oRm.openEnd();
		oRm.text(sLabel);
		oRm.close("div");
	};

	MicroChartRenderUtils.extendMicroChartRenderer(ColumnMicroChartRenderer);

	return ColumnMicroChartRenderer;

}, /* bExport= */ true);
