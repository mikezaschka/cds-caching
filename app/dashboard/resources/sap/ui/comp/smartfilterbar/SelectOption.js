/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/ui/comp/library","sap/ui/core/Element","sap/ui/model/FilterOperator"],function(e,r,t){"use strict";var i=r.extend("sap.ui.comp.smartfilterbar.SelectOption",{metadata:{library:"sap.ui.comp",properties:{sign:{type:"sap.ui.comp.smartfilterbar.SelectOptionSign",group:"Misc",defaultValue:"I"},operator:{type:"string",group:"Misc",defaultValue:"EQ"},low:{type:"string",group:"Misc",defaultValue:null},high:{type:"string",group:"Misc",defaultValue:null}}},setOperator(e){if(e!=null&&!(e in t)){throw new Error(`"${e}" is not a valid sap.ui.model.FilterOperator`)}return this.setProperty("operator",e)}});i.SIGN=e.smartfilterbar.SelectOptionSign;i.OPERATOR=t;return i});
//# sourceMappingURL=SelectOption.js.map