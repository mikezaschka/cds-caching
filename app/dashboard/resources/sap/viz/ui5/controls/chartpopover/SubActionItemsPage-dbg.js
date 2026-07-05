/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define([
    'sap/ui/core/Control',
    'sap/m/List',
    'sap/m/ActionListItem'
], function(Control, List, ActionListItem) {
    "use strict";

    var SubActionItemsPage = Control.extend('sap.viz.ui5.controls.chartpopover.SubActionItemsPage', {
        metadata : {
            library: "sap.viz",
            properties : {
                items : {
                    type : 'object[]'
                }
            }
        },
        renderer : {
            apiVersion: 2,
            render : function(oRm, oControl) {
                oRm.openStart('div')
                    .class("viz-controls-chartPopover-subActionItemsPage")
                    .openEnd()
                    .renderControl(oControl._oList)
                    .close('div');
            }
        }
    });

    SubActionItemsPage.prototype.init = function() {
        this._oList = new List({
        });
    };

    SubActionItemsPage.prototype.onAfterRendering = function() {
        setTimeout(function(){
            this._oList && this._oList.focus();
        }.bind(this), 10);
    };

    SubActionItemsPage.prototype.exit = function() {
        if (this._oList) {
            this._oList.destroy();
            this._oList = null;
        }
    };

    SubActionItemsPage.prototype.setItems = function(items) {
        this._oList.destroyItems();
        if ( Array.isArray(items) ) {
	        var item;
	        for (var i = 0; i < items.length; i++) {
	            item = new ActionListItem({
	                text : items[i].text,
	                press : items[i].press ? items[i].press : function() {
	                },
	                tooltip: items[i].text
	            });
	            this._oList.addItem(item);
	        }
        }
        this.setProperty("items", items);
        return this;
    };

    SubActionItemsPage.prototype._createId = function(sId) {
        return this.getId() + "-" + sId;
    };

    return SubActionItemsPage;
});
