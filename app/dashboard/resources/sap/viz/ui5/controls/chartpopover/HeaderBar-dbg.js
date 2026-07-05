/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define([
    'sap/ui/thirdparty/jquery',
    'sap/m/library',
    'sap/m/Bar',
    'sap/m/Button',
    'sap/m/Label',
    'sap/ui/core/IconPool',
    'sap/ui/core/Lib'

], function(jQuery, mobileLibrary, Bar, Button, Label, IconPool, Library) {
    "use strict";

    // shortcut for ButtonType
    var ButtonType = mobileLibrary.ButtonType;

    var HeaderBar = Bar.extend('sap.viz.ui5.controls.chartpopover.HeaderBar', {
        metadata : {
            library: "sap.viz",
            properties : {
                'showNavButton' : 'boolean',
                'title' : 'string'
            },
            publicMethods : [],
            events : {
                "navButtonPress" : {},
                "closeButtonPress" : {}
            }
        },
        renderer : {
            apiVersion: 2
        }
    });

    HeaderBar.prototype.getContentLeft = function() {
        if (!this._oNavButton) {
            this._oNavButton = new Button(this._createId("popoverNavButton"), {
                type : ButtonType.Back,
                tooltip : Library.getResourceBundleFor("sap.m").getText("PAGE_NAVBUTTON_TEXT"),
                press : jQuery.proxy(function() {
                    this.fireNavButtonPress();
                }, this)
            }).addStyleClass('viz-controls-chartPopover-backButton');
        }
        this._oNavButton.setVisible(this.getShowNavButton());
        this._oNavButton.onAfterRendering = function(){
            this.focus();
        };
        return [this._oNavButton];
    };

    HeaderBar.prototype.getContentMiddle = function() {
        if (!this._oTitleLabel) {
            this._oTitleLabel = new Label(this._createId('popoverHeaderTitle')).addStyleClass('viz-controls-chartPopover-titleLabel');
            this.addAriaLabelledBy(this._oTitleLabel);
        }
        this._oTitleLabel.setText(this.getTitle());
        return [this._oTitleLabel];
    };

    HeaderBar.prototype.getContentRight = function() {
        if (!this._oCloseButton) {
            this._oCloseButton = new Button(this._createId("popoverCloseButton"), {
                icon : IconPool.getIconURI("decline"),
                tooltip : Library.getResourceBundleFor("sap.m").getText("MESSAGEPOPOVER_CLOSE"),
                press : jQuery.proxy(function() {
                    this.fireCloseButtonPress();
                }, this)
            }).addStyleClass('viz-controls-chartPopover-closeButton');
        }
        return [this._oCloseButton];
    };

//    HeaderBar.prototype.onBeforeRendering = function () {
//        this.addAriaLabelledBy(this._oTitleLabel);
//    };

    HeaderBar.prototype.exit = function() {
        if (this._oCloseButton) {
            this._oCloseButton.destroy();
            this._oCloseButton = null;
        }

        if (this._oTitleLabel) {
            this._oTitleLabel.destroy();
            this._oTitleLabel = null;
        }

        if (this._oNavButton) {
            this._oNavButton.destroy();
            this._oNavButton = null;
        }
        Bar.prototype.exit.apply(this, arguments);
    };

    HeaderBar.prototype._createId = function(sId) {
        return this.getId() + "-" + sId;
    };

    return HeaderBar;
});
