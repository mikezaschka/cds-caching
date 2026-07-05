/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/ui/comp/smartfield/type/TextArrangementString","sap/ui/model/odata/type/DateTimeWithTimezone"],function(e,t){"use strict";var a=e.extend("sap.ui.comp.smartfield.type.IanaTextArrangement",{constructor:function(a){a=Object.assign({showDate:false,showTime:false},a);this.DateTimeWithTimezoneType=new t(a);return e.prototype.constructor.apply(this,arguments)}});a.prototype.formatValue=function(t,a){t[0]=this.DateTimeWithTimezoneType.formatValue([null,t[0]],a);return e.prototype.formatValue.call(this,t,a)};a.prototype.getName=function(){return"sap.ui.comp.smartfield.type.IanaTextArrangement"};return a});
//# sourceMappingURL=IanaTextArrangement.js.map