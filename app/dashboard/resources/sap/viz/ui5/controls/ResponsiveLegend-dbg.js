/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define([],
  function () {
    "use strict";
    /**
     * Constructor for ResponsiveLegend - must not be used: To get a ResponsiveLegend instance, please use VizFrame.getResponsiveLegend.
     *
     * @name sap.viz.ui5.controls.ResponsiveLegend
     * @private
     * @hideconstructor
     */
    var ResponsiveLegend = function () {
      //Do not use the constructor
      throw new Error();
    };

    ResponsiveLegend.createInstance = function (oControl) {
      var oResponsiveLegendControl = Object.create(this.prototype || null);
      oResponsiveLegendControl._oLegendControl = oControl;
      return oResponsiveLegendControl;
    };

    ResponsiveLegend.prototype._oLegendControl = undefined;

    ResponsiveLegend.prototype.show = function () {
    };

    ResponsiveLegend.prototype.hide = function () {
    };

    ResponsiveLegend.prototype.setOpenBy = function (openBy) {
    };

    return ResponsiveLegend;
  }, true);
