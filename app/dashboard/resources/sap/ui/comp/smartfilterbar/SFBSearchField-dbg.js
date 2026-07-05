/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// Provides sap.ui.comp.smartfilterbar.SFBSearchField
sap.ui.define([
    "sap/m/SearchField",
    "sap/ui/comp/smartfilterbar/SFBSearchFieldRenderer",
    'sap/m/delegate/ValueStateMessage',
    "sap/ui/core/Lib",
    "sap/ui/core/library",
    'sap/ui/core/InvisibleMessage'
],
function (
    SearchField,
    SFBSearchFieldRenderer,
    ValueStateMessage,
    Library,
    coreLibrary,
    InvisibleMessage
) {
    "use strict";

    // shortcut for sap.ui.core.ValueState
    var ValueState = coreLibrary.ValueState;

    // For performance reasons we need to limit the user search to a length of 1000 characters.
    var iMaxLength = 1000;

    // CSS class that adds ValueState styles to the search field
    var sCSSClassValueStateError = "sapMSFContentWrapperError";

    /**
     * Constructor for a new <code>SFBSearchField</code>.
     *
     * @param {string} [sId] ID for the new control, generated automatically if no ID is given
     * @param {object} [mSettings] Initial settings for the new control
     *
     * @class
     * Private control used by the <code>SmartFilterBar</code> control.
     *
     * @extends sap.m.SearchField
     *
     * @author SAP SE
     * @version 1.136.0
     *
     * @constructor
     * @private
     * @since 1.131.0
     * @alias sap.ui.comp.smartfilterbar.SFBSearchField
     */
    var SFBSearchField = SearchField.extend("sap.ui.comp.smartfilterbar.SFBSearchField", {
        metadata: {
            library: "sap.ui.comp",
            properties: {
                valueState: {
                    type: "sap.ui.core.ValueState",
                    group: "Appearance",
                    defaultValue: ValueState.None
                },
                valueStateText: {
                    type: "string",
                    group: "Misc",
                    defaultValue: null
                }
            }
        },
        renderer: SFBSearchFieldRenderer
    });

    SFBSearchField.prototype.init = function() {
        SearchField.prototype.init.apply(this, arguments);
        this._oCoreRB = Library.getResourceBundleFor("sap.ui.core");
        this._oValueState = new ValueStateMessage(this);
        this._oInvisibleMessage = InvisibleMessage.getInstance();
        this.addEventDelegate({
            onfocusin: function() {
                this.addStyleClass("sapMFocus");
                this._oValueState.open();
            }.bind(this),
            onfocusout: function() {
                this.validateValue();
                this._oValueState.close();
            }.bind(this)
        });
    };

    /**
     *  Checks if the length of the value of BasicSearch is less than 1000 characters long
     * @private
     * @returns {boolean}  true indicates that the BasicSearch is within the 1000 characters limit
     */
    SFBSearchField.prototype._validateBasicSearchLength = function() {
        return this.getValue()?.length > 1000 ? false : true;
    };

    /**
     * Validates the length of the BasicSearch field and adds ValueState to it.
     * @returns {boolean} true indicates that the value of BasicSearch is valid
     */
    SFBSearchField.prototype.validateValue = function() {
        var bValid = this._validateBasicSearchLength(),
            sValueState = this.getValueState();

        if (bValid && sValueState === ValueState.Error) {
            this.setValueState(ValueState.None);
            this.removeStyleClass(sCSSClassValueStateError);
        } else if (!bValid && sValueState === ValueState.None) {
            this.addStyleClass(sCSSClassValueStateError);
            this.setValueState(ValueState.Error);
        }
        this.setValueStateText(this._oCoreRB.getText("EnterTextMaxLength", [iMaxLength]));

        return bValid;
    };

    /**
     * Gets the ID of the value state message.
     *
     * @returns {string} The ID of the value state message
     */
    SFBSearchField.prototype.getValueStateMessageId = function() {
        return this.getId() + "-message";
    };

    SFBSearchField.prototype.exit = function() {
        SearchField.prototype.exit.apply(this, arguments);
        this._oValueState.destroy();
        this._oValueState = null;
        this._oCoreRB = null;
    };

    SFBSearchField.prototype.getDomRefForValueStateMessage = function() {
        return this.getDomRef();
    };

    return SFBSearchField;

});
