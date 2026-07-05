/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define([
    "sap/ui/thirdparty/jquery",
    './ContentPanel',
    './HeaderBar',
    './SubActionItemsPage',
    'sap/ui/core/Control',
    'sap/viz/ui5/format/ChartFormatter',
    '../common/utils/FormatDataUtil',
    'sap/m/library',
    'sap/m/ActionListItem',
    'sap/m/Bar',
    'sap/m/Label',
    'sap/m/List',
    'sap/m/ResponsivePopover',
    'sap/m/StandardListItem'
], function(jQuery, ContentPanel, HeaderBar, SubActionItemsPage, Control, ChartFormatter, FormatDataUtil, mobileLibrary, ActionListItem, Bar, Label, List, ResponsivePopover, StandardListItem) {
    "use strict";

    var PlacementType = mobileLibrary.PlacementType;

    /**
     * ChartPopover provides a popover used with charts to display chart selections.
     * Content and Action List Items can be customized.
     *
     */
      var ChartPopover = Control.extend('sap.viz.ui5.controls.chartpopover.ChartPopover', {
        metadata : {
            library: "sap.viz",
            properties : {
                'customDataControl' : {
                    type : 'any'
                }, //Parameter is selectData and returned Value is an UI5 Controls
                'actionItems' : {
                    type : 'object[]'
                },
                'formatString': {
                    type: 'any'
                },
                'chartType' : {
                     type : 'string'
                },
                'showLine' : {
                    type: 'boolean',
                    defaultValue : true
                }
            }
        },
        renderer: null // this is a popup-like control, it has no renderer
    });

    ChartPopover.prototype.init = function() {
        this._listItemHeight = 3;
        this._isClosedByHeaderButton = false;
        this._isActionItemsChanged = true;
        //3rem
        this._options = null;
        this._oContentPanel = new ContentPanel(this._createId('vizContentPanel'), {});

        this._oSelectedLabel = new Label(this._createId('vizSelectedLabel'), { });

        this._oSelectedBar = new Bar(this._createId('vizSelectedBar'), {
            contentMiddle : [this._oSelectedLabel]
            })
            .addStyleClass('viz-controls-chartPopover-vizSelectedBar')
            .addStyleClass('viz-controls-chartPopover-vizSelectedBarBorder');

        this._oCustomHeader = new HeaderBar(this._createId('vizHeaderBar'), {
            title : sap.viz.extapi.env.Language.getResourceString("IDS_CURRENT_SELECTION"),
            showNavButton : false,
            closeButtonPress : jQuery.proxy(this.close, this),
            navButtonPress : jQuery.proxy(this._navigateBack, this)
        });

        this._oPopover = new ResponsivePopover(this._createId('vizChartPopover'), {
            horizontalScrolling : false,
            placement : PlacementType.HorizontalPreferredRight,
            contentWidth : "18rem",
            customHeader : this._oCustomHeader,
            content : [this._oContentPanel]
        });
        this._oPopover.addStyleClass('viz-controls-chartPopover');
        this._oPopover.attachAfterClose(this._afterClose, this);
        this._oPopover.attachAfterOpen(this._afterOpen, this);

        this._setAriaLabelledBys();
        this._infoDiv = null;
        this._chartType = null;
    };

    ChartPopover.prototype._setAriaLabelledBys = function(){
        this._oPopover.removeAllAriaLabelledBy();

        this._oPopover.addAriaLabelledBy(this._oContentPanel);
        this._oPopover.addAriaLabelledBy(this._oSelectedLabel);
    };

    ChartPopover.prototype._afterOpen = function() {
        this._oCustomHeader._oCloseButton.focus();
    };

    ChartPopover.prototype._afterClose = function() {
        this._navigateBack(true);
        if (this._options && this._options.selectedValues < 1) {
            this._oPopover.removeContent(this._oSelectedBar);
        }
        if (this._infoDiv && this._isClosedByHeaderButton) {
            this._isClosedByHeaderButton = false;
            this._infoDiv.focus();
        }
    };

    /**
     * Returns true if the popover is open, otherwise false.
     *
     * @returns {boolean} true if the popover is open, otherwise false
     *
     */
    ChartPopover.prototype.isOpen = function() {
        return this._oPopover.isOpen();
    };

    function hasClass(node, clz) {
        if (!node || !node.getAttribute) {
            return false;
        }
        var nodeClz = node.getAttribute('class') || "";
        return (' ' + nodeClz + ' ').indexOf(' ' + clz + ' ') >= 0;
    }

    /**
     * Open Chart's Popover.
     */
    ChartPopover.prototype.openBy = function(oControl, bSkipInstanceManager) {
        if (oControl) {
            this._oCustomHeader.setTitle(sap.viz.extapi.env.Language.getResourceString('IDS_CURRENT_SELECTION'));
            this._updateContent();
            this._updateActionItems();

            //Set Popover's openBy element
            var targetElement = this._updatePopoverSettings(oControl);
            var contents = this._oPopover.getContent();
            if (contents.length > 0){
                this._oPopover.setInitialFocus(contents[0].getId());
            }
            setTimeout(function(){
                this._oPopover.openBy(targetElement, bSkipInstanceManager); //oControl.firstChild
            }.bind(this), 0);
        }
        return this;
    };

    /**
     * Close Chart's Popover.
     */
    ChartPopover.prototype.close = function(event) {
        if (event && event.getSource && (this._oCustomHeader.getId() === event.getSource().getId())) {
            this._isClosedByHeaderButton = true;
        }
        this._oPopover.close();
        return this;
    };

    /**
     * Destroy Chart's Popover
     */
    ChartPopover.prototype.exit = function() {
        if (this._oContentPanel) {
            this._oContentPanel.destroy();
            this._oContentPanel = null;
        }

        if (this._oSelectedBar) {
            this._oSelectedBar.destroy();
            this._oSelectedBar = null;
        }

        if (this._oSelectedLabel) {
            this._oSelectedLabel.destroy();
            this._oSelectedLabel = null;
        }

        if (this._oCustomHeader) {
            this._oCustomHeader.destroy();
            this._oCustomHeader = null;
        }

        if (this._oCustomPanel) {
            this._oCustomPanel.destroy();
            this._oCustomPanel = null;
        }

        if (this._oPopover) {
            this._oPopover.destroy();
            this._oPopover = null;
        }

        if (this._targetElement){
            this._targetElement.remove();
            this._targetElement = null;
        }

        this._options = null;
        this._infoDiv = null;
        this._chartType = null;
    };

    /**
     * Set popover's options
     */
    ChartPopover.prototype.setOptions = function(options) {
        var config = {
            formatString: this.getFormatString(),
            chartType: this.getChartType(),
            mode: "popover"
        };
        var data = FormatDataUtil.formatData(options, config);
        if (!this._infoDiv || this.getChartType() != this._chartType) {
            var node = options.target.parentNode;
            while (node && !hasClass(node, "v-info")) {
                node = node.parentNode;
            }
            this._infoDiv = node;
            this._chartType = this.getChartType();
        }
        if (this._infoDiv) {
            var _screenReaderDiv = this._infoDiv.querySelector(".v-m-screenreader-container");
            if (_screenReaderDiv) {
                var li = _screenReaderDiv.querySelector("li");
                if (li && options.selectedValues) {
                    var text = options.selectedValues === 1 ?
                            " " + sap.viz.extapi.env.Language.getResourceString("IDS_ITEM_SELECTED") :
                            " " + sap.viz.extapi.env.Language.getResourceString("IDS_ITEMS_SELECTED") ;
                    li.innerText = options.selectedValues + text;
                }
            }
        }
        this._options = options;
        this._oContentPanel.setShowLine(this.getShowLine()).setContentData(data);
        if (!data.val || options.selectedValues > 1) {
            this._oSelectedLabel.setText(options.selectedValues + " " +
                    (options.selectedValues === 1 ? sap.viz.extapi.env.Language.getResourceString("IDS_ITEM_SELECTED") :
                            sap.viz.extapi.env.Language.getResourceString("IDS_ITEMS_SELECTED")));
            this._oPopover.insertContent(this._oSelectedBar, 1);
            if (data.val === undefined){
                //Legend Selection or category selection or lasso selection
                this._oSelectedBar.removeStyleClass('viz-controls-chartPopover-vizSelectedBarBorder');
            }
        } else {
            this._oPopover.removeContent(this._oSelectedBar);
        }
        return this;
    };

    ChartPopover.prototype.setActionItems = function(items){
        this._actionItems = [];
        this._actionItems = jQuery.extend(true, this._actionItems, items);
        this._isActionItemsChanged = true;
        return this;
    };

    ChartPopover.prototype.getActionItems = function(items){
        return this._actionItems;
    };

    ChartPopover.prototype._updateContent = function() {
        var contents = this.getCustomDataControl();
        if (contents) {
            //Has Custom Data Content.
            //1. remove the repvious custom panel.
            //2. remove content panel
            //3. insert new custom panel
            if (this._oCustomPanel) {
                this._oPopover.removeContent(this._oCustomPanel);
            }
            this._oCustomPanel = contents(this._options);
            this._oPopover.removeContent(this._oContentPanel);
            this._oPopover.insertContent(this._oCustomPanel, 0);
            this._oSelectedBar.addStyleClass('viz-controls-chartPopover-vizSelectedBarBorder');
        } else {
            //No custom data content.
            this._oPopover.removeContent(this._oCustomPanel);
            this._oCustomPanel = null; // it does not work

            if (this._oContentPanel.isMultiSelected()){
                this._oPopover.removeContent(this._oContentPanel);
            } else if (this._oPopover.indexOfContent(this._oContentPanel) === -1) {
                this._oPopover.insertContent(this._oContentPanel, 0);
                this._oSelectedBar.addStyleClass('viz-controls-chartPopover-vizSelectedBarBorder');
            }
        }
        return this;
    };

    ChartPopover.prototype._updateActionItems = function() {
        if (this._isActionItemsChanged) {
            var actionItems = this._actionItems;
            if (!this._oActionList){
                //new action list
                actionItems = this.getActionItems();
                if (actionItems && actionItems.length > 0) {
                    this._actionItems = jQuery.extend(true, this._actionItems, actionItems);
                    this._oActionList = new List({
                    }).addStyleClass('viz-controls-chartPopover-actionList');
                    this._oPopover.addContent(this._oActionList);
                }
            }

            if (actionItems && actionItems.length > 0) {
                this._oActionList.removeAllItems();
                var item;

                var fnOnPress = function(event) {
                    var index = this._oActionList.indexOfItem(event.getSource());
                    var subActionItems = this._actionItems[index].children;
                    if (subActionItems && subActionItems.length > 0) {
                        this._oSubActionItemsPage = new SubActionItemsPage();
                        this._oPopover.insertContent(this._oSubActionItemsPage);

                        this._oSubActionItemsPage.setItems(subActionItems);
                        this._oCustomHeader.setTitle(this._actionItems[index].text);
                        this._navigateTo();
                    }
                };

                for (var i = 0, len = actionItems.length; i < len; i++) {
                    item = actionItems[i];
                    if (item.type === 'action') {
                        this._oActionList.addItem(new ActionListItem({
                            text : item.text,
                            press : item.press ? item.press : function() {
                            },
                            tooltip : item.text
                        }));
                    } else if (item.type === 'navigation') {
                        this._oActionList.addItem(new StandardListItem({
                            title : item.text,
                            type : 'Navigation',
                            press : fnOnPress.bind(this),
                            tooltip : item.text
                        }));
                    }
                }
            } else if (this._oActionList){
                this._oActionList.destroy();
                this._oActionList = null;
            }

            this._isActionItemsChanged = false;
        }
    };

    ChartPopover.prototype._navigateBack = function(popoverClosed) {
        this._resetHeaderBar();
        if (this._oActionList){
            this._oActionList.removeStyleClass('hideActionList');
            this._oActionList.focus();
        }
        if (!popoverClosed){
            this._setAriaLabelledBys();
        }
    };

    ChartPopover.prototype._resetHeaderBar = function() {
        this._oPopover.removeContent(this._oSubActionItemsPage);
        this._oCustomHeader.setShowNavButton(false).setTitle(sap.viz.extapi.env.Language.getResourceString("IDS_CURRENT_SELECTION"));
    };

    ChartPopover.prototype._navigateTo = function(pageId) {
        this._oCustomHeader.setShowNavButton(true);
        if (this._oActionList){
            this._oActionList.addStyleClass('hideActionList');
        }
        this._oPopover.removeAriaLabelledBy(this._oContentPanel);
    };

    /**
     * Creates an id for an Element prefixed with the control id
     *
     * @return {string} id
     */
    ChartPopover.prototype._createId = function(sId) {
        return this.getId() + "-" + sId;
    };


    ChartPopover.prototype._updatePopoverSettings = function(target){
            var data = this._options.data.val;
            var targetSize = target.getBoundingClientRect(),
                measureValue;
            var parseIntFn = function (number){
                return parseInt(number);
            };
            var targetData = target.__data__;
            if (data !== undefined){
                for (var i = 0, len = data.length; i < len; i++){
                    if (data[i].type && (data[i].type.toLowerCase() === "measure")){
                        measureValue = data[i].value;
                        break;
                    }
                }
            } else if (targetData && targetData.measureNames){
                measureValue = targetData[targetData.measureNames];
            }

            var dataType = this._options.data.type;
            var isDataTypeLine = dataType && dataType === "line";
            var targetElement, offsetX;
            switch (this.getChartType()){
                case 'info/bar':
                case 'info/dual_bar':
                    if (measureValue < 0) {
                        this._oPopover.setPlacement(PlacementType.PreferredLeftOrFlip);
                    } else {
                        this._oPopover.setPlacement(PlacementType.PreferredRightOrFlip);
                    }
                    targetElement = target.firstChild;
                    break;
                case 'info/column':
                case 'info/dual_column':
                case 'info/timeseries_column':
                    if (measureValue < 0){
                        this._oPopover.setPlacement(PlacementType.PreferredBottomOrFlip);
                    } else {
                        this._oPopover.setPlacement(PlacementType.PreferredTopOrFlip);
                    }
                    targetElement = target.firstChild;
                    break;
                case 'info/pie':
                case 'info/donut':
                    offsetX = parseIntFn(targetSize.width / 2);
                    this._oPopover.setOffsetX(-offsetX);
                    this._oPopover.setPlacement(PlacementType.PreferredRightOrFlip);
                    targetElement = target.firstChild;
                    break;
                case 'info/bullet':
                    this._oPopover.setPlacement(PlacementType.PreferredRightOrFlip);
                    targetElement = target;
                    break;
                case 'info/vertical_bullet':
                case 'info/timeseries_bullet' :
                    this._oPopover.setPlacement(PlacementType.PreferredTopOrFlip);
                    targetElement = target;
                    break;
                //Create DIV Element to workaround popover's reference issue.
                case 'info/line':
                case 'info/timeseries_line':
                case 'info/timeseries_scatter':
                case 'info/timeseries_bubble':
                case 'info/dual_line':
                case 'info/bubble':
                case 'info/time_bubble':
                case 'info/scatter':
                case 'info/stacked_bar':
                case 'info/dual_stacked_bar':
                case 'info/100_stacked_bar':
                case 'info/100_dual_stacked_bar':
                case 'info/waterfall':
                case 'info/timeseries_waterfall':
                case 'info/area':
                case 'info/radar':
                    this._oPopover.setPlacement(PlacementType.VerticalPreferredTop);
                    targetElement = target.firstChild;
                    break;
                case 'info/stacked_column':
                case 'info/dual_stacked_column':
                case 'info/100_stacked_column':
                case 'info/100_dual_stacked_column':
                case 'info/horizontal_waterfall':
                case 'info/heatmap':
                case 'info/treemap':
                case 'info/timeseries_stacked_column':
                case 'info/timeseries_100_stacked_column':
                    this._oPopover.setPlacement(PlacementType.HorizontalPreferredRight);
                    targetElement = target.firstChild;
                    break;
                //Handle Combination chart
                case 'info/combination':
                case 'info/timeseries_combination':
                case 'info/dual_timeseries_combination':
                    if (isDataTypeLine){
                        this._oPopover.setPlacement(PlacementType.PreferredTopOrFlip);
                    } else if (measureValue < 0){
                        this._oPopover.setPlacement(PlacementType.PreferredBottomOrFlip);
                    } else {
                        this._oPopover.setPlacement(PlacementType.PreferredTopOrFlip);
                    }
                    targetElement = target.firstChild;
                    break;
                case 'info/dual_combination':
                case 'info/stacked_combination':
                case 'info/dual_stacked_combination':
                case 'info/timeseries_stacked_combination':
                    if (isDataTypeLine){
                         this._oPopover.setPlacement(PlacementType.VerticalPreferredTop);
                     } else {
                         this._oPopover.setPlacement(PlacementType.HorizontalPreferredRight);
                     }
                    targetElement = target.firstChild;
                    break;
                case 'info/dual_horizontal_combination':
                case 'info/horizontal_stacked_combination':
                case 'info/dual_horizontal_stacked_combination':
                    if (isDataTypeLine){
                        this._oPopover.setPlacement(PlacementType.HorizontalPreferredRight);
                    } else {
                        this._oPopover.setPlacement(PlacementType.VerticalPreferredTop);
                    }
                    targetElement = target.firstChild;
                    break;
            }
            return targetElement;
    };

    ChartPopover.prototype.addStyleClass = function() {
        this._oPopover.addStyleClass.apply(this._oPopover, arguments);
    };

    ChartPopover.prototype.removeStyleClass = function() {
        this._oPopover.removeStyleClass.apply(this._oPopover, arguments);
    };

    return ChartPopover;
});
