/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/ui/model/FormatException","sap/ui/model/ParseException","sap/ui/model/SimpleType"],function(o,e,t){"use strict";var n=t.extend("sap.ui.comp.smartfield.type.AbapBool",{constructor:function(){t.apply(this,arguments);this.sName="sap.ui.comp.smartfield.type.AbapBool"}});n.prototype.formatValue=function(e,t){if(e===undefined||e===null){return null}switch(t){case"boolean":case"any":return e==="X";default:throw new o("Don't know how to format Boolean to "+t)}};n.prototype.parseValue=function(o,t){switch(t){case"boolean":return o===true?"X":"";default:throw new e("Don't know how to parse Boolean from "+t)}};n.prototype.validateValue=function(o){if(o!==null&&o!==undefined){if(o!=="X"&&o!==""){throw new e("Invalid Boolean "+o)}}};return n});
//# sourceMappingURL=AbapBool.js.map