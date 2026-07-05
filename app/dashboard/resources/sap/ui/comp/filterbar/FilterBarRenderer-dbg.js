/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

sap.ui.define([],

	function() {
		"use strict";

		/**
		 * FilterBar renderer.
		 * @namespace
		 */
		var FilterBarRenderer = {apiVersion: 2};

		/**
		 * Renders the HTML for the given control, using the provided
		 * {@link sap.ui.core.RenderManager}.
		 *
		 * @param {sap.ui.core.RenderManager} oRm the RenderManager that can be used for writing to the Render-Output-Buffer
		 * @param {sap.ui.comp.filterbar.FilterBar} oFilterBar the button to be rendered
		 */
		FilterBarRenderer.render = function(oRm, oFilterBar) {
			oRm.openStart("div", oFilterBar);
				oRm.class("sapUiCompFilterBar");
				oRm.class(oFilterBar._isPhone() ? "sapUiCompFilterBarPhone" : "sapUiCompFilterBarNonPhone");
				if (oFilterBar.getUseToolbar()) {
					oRm.class("sapUiCompFilterBarWithToolbar");
				}

				if (!oFilterBar.getAdvancedMode()) {
					oRm.class("sapContrastPlus");
				}
			oRm.openEnd();
				this.renderToolbar(oRm, oFilterBar);
				if (oFilterBar._shouldRenderAdvancedLayout()) {
					this.renderAdvancedFilterItems(oRm, oFilterBar);
				} else {
					this.renderFilterItems(oRm, oFilterBar);
				}

				this.renderHintText(oRm, oFilterBar);
				/** @deprecated As of version 1.122 together with the content aggregation */
				this.renderContent(oRm, oFilterBar);
			oRm.close("div");
		};

		FilterBarRenderer.renderToolbar = function (oRm, oFilterBar) {
			if (!oFilterBar.getUseToolbar()) {
				oRm.cleanupControlWithoutRendering(oFilterBar.getAggregation("_toolbar"));
				return; // Early return if no toolbar is used
			}

			oRm.renderControl(oFilterBar.getAggregation("_toolbar"));
		};

		FilterBarRenderer.renderHintText = function (oRm, oFilterBar) {
			if (oFilterBar.getAdvancedMode() || oFilterBar._isPhone() || oFilterBar._hasAnyVisibleFiltersOnFB() || !oFilterBar.getUseToolbar()) {
				oRm.cleanupControlWithoutRendering(oFilterBar.getAggregation("_hintText"));
				return; // Early return if filterbar is in advanced mode, or is on phone or there any visible filters or no toolbar
			}

			oRm.renderControl(oFilterBar.getAggregation("_hintText"));
		};

		/**
		 * @deprecated As of version 1.122 together with the content aggregation
		 */
		FilterBarRenderer.renderContent = function (oRm, oFilterBar) {
			var aContent = oFilterBar.getContent();

			if (!aContent.length) {
				return;
			}

			oRm.openStart("div");
			oRm.class("sapUiCompFilterBarContent");
			oRm.openEnd();
				aContent.forEach(oRm.renderControl);
			oRm.close("div");
		};

		FilterBarRenderer.renderFilterItems = function (oRm, oFilterBar) {
			if (!oFilterBar.getFilterBarExpanded() && oFilterBar.getUseToolbar()) {
				// Early return if the filter bar is not expanded and toolbar is used
				return;
			}

			const aItems = oFilterBar._mAdvancedAreaFilterFlat.length ? oFilterBar._mAdvancedAreaFilterFlat : oFilterBar._getAllFilterItemsFlat();
			oRm.openStart("div", `${oFilterBar.getId()}-items`);
			oRm.class("sapUiCompFilterBarItems");
			oRm.openEnd();
				this.renderBasicSearch(oRm, oFilterBar);

				const fIsFilterHidden = function (oItem) {
					const oFilterGroupItem = oItem.filterItem;
					if (!oFilterGroupItem.getVisible() || !oFilterGroupItem.getVisibleInFilterBar() || oFilterGroupItem.getHiddenFilter()) {
						return true;
					}

					return false;
				};

				const iTotalHiddenFilters = aItems.filter(fIsFilterHidden).length;

				let iHiddenFilters = 0;
				for (let i = 0; i < aItems.length; i++) {
					const iRenderedFilters = i - iHiddenFilters;

					if (oFilterBar._shouldSkipRenderFilters(iRenderedFilters)) {
						break;
					}

					if (fIsFilterHidden(aItems[i])) {
						iHiddenFilters++;
						continue; // skip rendering
					}

					this.renderFilterItem(oRm, oFilterBar, aItems[i].filterItem);
				}

				const iSpacersCount = Math.max(4, aItems.length - 1);
				for (let i = 0; i < iSpacersCount; i++) {
					if (aItems[i]?.filterItem?.getVisibleInFilterBar()) {
						this.renderFilterItemSpacer(oRm, oFilterBar);
					}
				}

				this.renderButtons(oRm, oFilterBar);
				this.renderShowAllButton(oRm, oFilterBar, aItems.length - iTotalHiddenFilters);
			oRm.close("div");
		};

		FilterBarRenderer.renderFilterItem = function (oRm, oFilterBar, oFilterGroupItem) {
			oRm.openStart("div", oFilterGroupItem);
			if (oFilterBar._shouldRenderAdvancedLayout()) {
				oRm.class("sapUiCompFilterBarAdvancedItem");
			} else {
				oRm.class("sapUiCompFilterBarItem");
				this.setContainerWidth(oRm, oFilterBar);
			}

			oRm.openEnd();
				if (oFilterGroupItem.getAggregation("_debug")) {
					oRm.openStart("div");
					oRm.openEnd();
					oRm.renderControl(oFilterGroupItem.getAggregation("_debug"));
				}
					oRm.renderControl(oFilterGroupItem._oLabel);
				if (oFilterGroupItem.getAggregation("_debug")) {
					oRm.close("div");
				}
				oRm.openStart("div");
				oRm.class("sapUiCompFilterBarItemEmptyDiv");
				oRm.openEnd();
				oRm.close("div");
				oRm.renderControl(oFilterGroupItem._getControl());
			oRm.close("div");
		};

		FilterBarRenderer.renderFilterItemSpacer = function (oRm, oFilterBar) {
			oRm.openStart("div");
			oRm.class("sapUiCompFilterBarItemSpacer");
			this.setContainerWidth(oRm, oFilterBar);
			oRm.openEnd();
			oRm.close("div");
		};

		FilterBarRenderer.renderBasicSearch = function (oRm, oFilterBar) {
			const oBasicSearchField = oFilterBar._oBasicSearchField;
			if (!oBasicSearchField || oFilterBar.getUseToolbar()
				|| oBasicSearchField.getParent() !== oFilterBar || (oBasicSearchField.getParent() === oFilterBar && oBasicSearchField.sParentAggregationName === "content")) {
				return; // Early return if basic search field doesn't exist or toolbar is used
			}

			oRm.openStart("div", `${oFilterBar.getId()}-item-basicSearch`);
			oRm.class("sapUiCompFilterBarBasicSearch");
			this.setContainerWidth(oRm, oFilterBar);
			oRm.openEnd();
				oRm.renderControl(oFilterBar._oBasicSearchField);
			oRm.close("div");
		};

		FilterBarRenderer.renderButtons = function(oRm, oFilterBar) {
			if (oFilterBar._shouldSkipRenderButtons()) {
				return; // Early return if toolbar is used
			}

			oRm.openStart("div", `${oFilterBar.getId()}-item-buttons`);
			oRm.class("sapUiCompFilterBarButtons");
			oRm.openEnd();
				oFilterBar._getButtons().forEach(oRm.renderControl);
			oRm.close("div");
		};

		FilterBarRenderer.renderShowAllButton = function(oRm, oFilterBar, iItemsCount) {
			if (!oFilterBar.getIsRunningInValueHelpDialog() || oFilterBar.getShowAllFilters() || iItemsCount <= oFilterBar._nMaxFiltersByDefault) {
				return; // Early return if not running in value help dialog or showAllFilters is true
			}

			oRm.openStart("div", `${oFilterBar.getId()}-showAll-container`);
			oRm.class("sapUiCompFilterBarButtons");
			oRm.openEnd();
			oRm.renderControl(oFilterBar.getAggregation("_showAllFiltersButton"));
			oRm.close("div");
		};

		FilterBarRenderer.setContainerWidth = function (oRm, oFilterBar) {
			const sWidth = oFilterBar.getFilterContainerWidth();
			if (sWidth !== "12rem") {
				oRm.style("flex-basis", sWidth);
				oRm.style("max-width", oFilterBar.getUseToolbar() ? sWidth : oFilterBar._getMaxItemWidth());
			}
		};

		FilterBarRenderer.renderAdvancedFilterItems = function (oRm, oFilterBar) {
			const aItems = oFilterBar._mAdvancedAreaFilterFlat.length ? oFilterBar._mAdvancedAreaFilterFlat : oFilterBar._getAllFilterItemsFlat(),
				mGroupsWithVisibleFilters = oFilterBar._groupsWithVisibleFilters() ?? {},
				iNumberOfGroups = Object.keys(mGroupsWithVisibleFilters).length;

			if (!aItems?.length || !oFilterBar.getFilterBarExpanded()) {
				return;
			}

			oRm.openStart("div", `${oFilterBar.getId()}-items`);
				oRm.class("sapUiCompFilterBarAdvancedItems");
				if (iNumberOfGroups <= 2) {
					oRm.class("sapUiCompFilterBarAdvancedItemsTwoGroups");
				}
			oRm.openEnd();

			if (iNumberOfGroups === 1) {
				this.renderAdvancedFilterItemsSingleGroup(oRm, oFilterBar, aItems);
			} else {
				this.renderAdvancedFilterItemsMultiGroups(oRm, oFilterBar, aItems, iNumberOfGroups);
			}

			oRm.close("div");
		};

		FilterBarRenderer.renderAdvancedFilterItemsSingleGroup = function (oRm, oFilterBar, aItems) {
			const iNumberOfItems = aItems.length;
			let aOpenGroupIndexes = [0, Math.ceil(iNumberOfItems / 2)],
				aCloseGroupIndexes = [Math.ceil(iNumberOfItems / 2) - 1, iNumberOfItems - 1];

			if (iNumberOfItems <= 2) {
				aOpenGroupIndexes = [0];
				aCloseGroupIndexes = [iNumberOfItems - 1];
			}

			for (let i = 0; i < iNumberOfItems; i++) {
				const oItem = aItems[i],
					oFilterGroupItem = oItem.filterItem;

				if (aOpenGroupIndexes.includes(i)) {
					// Render FilterGroup container
					oRm.openStart("div");
					oRm.class("sapUiCompFilterBarAdvancedGroup");
					oRm.openEnd();
				}

				if (oFilterGroupItem.getVisible() && oFilterGroupItem.getVisibleInFilterBar() && !oFilterGroupItem.getHiddenFilter()) {
					this.renderFilterItem(oRm, oFilterBar, oFilterGroupItem);
				}

				if (aCloseGroupIndexes.includes(i)) {
					// Close FilterGroup container
					oRm.close("div");
				}
			}
		};

		FilterBarRenderer.renderAdvancedFilterItemsMultiGroups = function (oRm, oFilterBar, aItems, iNumberOfGroups) {
			let sGroupName;

			for (let i = 0; i < aItems.length; i++) {
				const oItem = aItems[i],
					oNextItem = aItems[i + 1],
					sItemGroupName = oItem.group,
					sItemGroupLabel = oItem.groupLabel,
					oFilterGroupItem = oItem.filterItem;

				if (sGroupName !== sItemGroupName) {
					// Render FilterGroup container
					sGroupName = sItemGroupName;
					oRm.openStart("div");
					oRm.class("sapUiCompFilterBarAdvancedGroup");
					oRm.openEnd();
					if (sItemGroupName !== "__$INTERNAL$" && iNumberOfGroups > 1) {
						oRm.openStart("h5");
						oRm.class("sapUiCompFilterBarAdvancedGroupHeader");
						oRm.openEnd();
						oRm.text(sItemGroupLabel);
						oRm.close("h5");
					}
				}

				if (oFilterGroupItem.getVisible() && oFilterGroupItem.getVisibleInFilterBar() && !oFilterGroupItem.getHiddenFilter()) {
					this.renderFilterItem(oRm, oFilterBar, oFilterGroupItem);
				}

				if (!oNextItem || sGroupName !== oNextItem.group) {
					// Close FilterGroup container
					oRm.close("div");
				}
			}
		};

		return FilterBarRenderer;
	}, /* bExport= */ true);
