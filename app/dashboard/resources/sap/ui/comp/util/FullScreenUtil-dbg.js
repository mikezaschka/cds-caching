/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */

// ------------------------------------------------------------------------------------------
// Utility class used by smart controls for switching a control to full-screen mode and back.
// ------------------------------------------------------------------------------------------
sap.ui.define([
	"sap/ui/thirdparty/jquery", "sap/m/Dialog", "sap/ui/core/HTML"
], function(jQuery, Dialog, HTML) {
	"use strict";

	/**
	 * Utility class used by smart controls for switching a control to fullscreen
	 *
	 * This module is only for internal use!
	 *
	 * @private
	 */
	var FullScreenUtil = {
		/**
		 * Static function that toggles a control to full screen mode.<br>
		 * Please ensure that you call the clean up function when the control (enabled here for full screen) is destroyed!
		 *
		 * @param {Object} oControl - the control which can be toggled to full screen
		 * @param {boolean} bEnterFullScreen - whether the control should be enter/exit full screen mode
		 * @param {Object} oFullScreenButton - full screen button of the control which can be toggled to full screen
		 * @param {function} fnExternalClose - callback function to be called when dialog is closed externally (E.g. due to navigation)
		 * @private
		 */
		toggleFullScreen: function(oControl, bEnterFullScreen, oFullScreenButton, fnExternalClose, sStyleClass, bDisableScrolling) {
			var $oContent;
			// Switch to full-screen mode
			if (bEnterFullScreen) {
				// get the dom reference of the control
				$oContent = oControl.$();
				// add 100% height to the FlexBox container for the Control to rendering in full screen
				$oContent.css("height", "100%");
				if ($oContent) {
					// Create an HTML element to add the controls DOM content in the FullScreen dialog
					if (!oControl._oHTML) {
						oControl._oHTML = new HTML({
							preferDOM: false,
							afterRendering: function() {
								if (oControl && oControl._oHTML) {
									var $oHTMLContent = oControl._oHTML.$(), oChildren;
									// Get the current HTML Dom content
									if ($oHTMLContent) {
										// remove any old child content
										oChildren = $oHTMLContent.children();
										oChildren.remove();
										// stretch the content to occupy the whole space
										$oHTMLContent.css("height", "100%");
										// append the control dom to HTML content
										$oHTMLContent.append(oControl.getDomRef());
									}
								}
							}
						});
					}
					// Create and set a fullscreen Dialog (without headers) on the registered control instance
					if (!oControl._oFullScreenDialog) {
						oControl._oFullScreenDialog = new Dialog({
							showHeader: false,
							stretch: true,
							horizontalScrolling: !bDisableScrolling,
							verticalScrolling: !bDisableScrolling,
							beforeClose: function() {
								// In case fullscreen dialog was closed due to navigation to another page/view/app, "Esc" click, etc. The dialog close
								// would be triggered externally and we need to clean up and replace the DOM content back to the original location
								if (oControl && oControl._$placeHolder && fnExternalClose) {
									fnExternalClose.call(oControl, false);
								}
							},
							content: [
								oControl._oHTML
							]
						});
						//can be set from outside, i. e. to ensure proper styling of SmartChart when used with sapBelizePlus
						if (sStyleClass) {
							oControl._oFullScreenDialog.addStyleClass(sStyleClass);
						}
						// Set focus back on full-screen button of control
						if (oFullScreenButton) {
							oControl._oFullScreenDialog.attachAfterOpen(function() {
								oFullScreenButton.focus();
								// Hack to update scroll of sap.m.List/ResponsiveTable - 2/2
								if (oControl._oGrowingDelegate && oControl._oGrowingDelegate.onAfterRendering) {
									// Temporarily change the parent of control to Fullscreen Dialog
									oControl._oOldParent = oControl.oParent;
									oControl.oParent = oControl._oFullScreenDialog;
									// update delegate to enable scroll with new parent
									oControl._oGrowingDelegate.onAfterRendering();
									// restore parent
									oControl.oParent = oControl._oOldParent;
									// delete unnecessary props
									delete oControl._oOldParent;
								}
							});
							oControl._oFullScreenDialog.attachAfterClose(function() {
								oFullScreenButton.focus();
							});
						}
						// add the style class from control to the dialog
						oControl._oFullScreenDialog.addStyleClass($oContent.closest(".sapUiSizeCompact").length ? "sapUiSizeCompact" : "");
						// add style class to make the scroll container height as 100% (required to stretch UI to 100% e.g. for SmartChart)
						oControl._oFullScreenDialog.addStyleClass("sapUiCompSmartFullScreenDialog");
					}
					// create a dummy div node (place holder)
					oControl._$placeHolder = jQuery(document.createElement("div"));
					// Set the place holder before the current content
					$oContent.before(oControl._$placeHolder);
					// Add a dummy div as content of the HTML control
					oControl._oHTML.setContent("<div></div>");
				}
				// Hack to update scroll of sap.m.List/ResponsiveTable - 1/2
				if (!oControl._oGrowingDelegate) {
					oControl._oGrowingDelegate = oControl._oTable || oControl._oList;
					if (oControl._oGrowingDelegate && oControl._oGrowingDelegate.getGrowingScrollToLoad && oControl._oGrowingDelegate.getGrowingScrollToLoad()) {
						oControl._oGrowingDelegate = oControl._oGrowingDelegate._oGrowingDelegate;
					} else {
						oControl._oGrowingDelegate = null;
					}
				}
				// Opening the ui.Table in fullscreen mode might affect the number of visible rows. Since this util is
				// cloning the dom elements, the rows won't be updated unless the table is invalidated.
				if (oControl._oTable && oControl._oTable.isA("sap.ui.table.Table")) {
					oControl._oFullScreenDialog.attachEventOnce("afterOpen", function() {
						oControl._oTable.invalidate();
					});
				}
				// open the full screen Dialog
				oControl._oFullScreenDialog.open();
				// Switch back from full-screen mode
			} else if (oControl._$placeHolder && oControl._oHTML) {

				// Restore control height
				var sControlHeight = oControl.getHeight && oControl.getHeight();
				var $oElem = oControl.$();
				if (sControlHeight && sControlHeight !== $oElem.css("height")) {
					$oElem.css("height", sControlHeight);
				}

				// get the HTML controls content --> as it should contain the control's current DOM ref
				$oContent = oControl._oHTML.$();
				// Replace the place holder with the Controls DOM ref (child of HTML)
				oControl._$placeHolder.replaceWith($oContent.children());

				oControl._$placeHolder = null;
				$oContent = null;

				// close the full screen Dialog
				if (oControl._oFullScreenDialog) {
					oControl._oFullScreenDialog.close();
				}
			}
		},
		/**
		 * Static function that cleans up resources created for full-screen mode.<br>
		 *
		 * @param {Object} oControl - the control which can be toggled to full screen
		 * @private
		 */
		cleanUpFullScreen: function(oControl) {
			// Destroy the Dialog and hence the containing HTML control
			if (oControl._oFullScreenDialog) {
				oControl._oFullScreenDialog.destroy();
				oControl._oFullScreenDialog = null;
			}
			// clean up instance variables created for full screen mode
			oControl._$placeHolder = null;
			oControl._oHTML = null;
			oControl._oGrowingDelegate = null;
		}
	};

	return FullScreenUtil;

}, /* bExport= */true);
