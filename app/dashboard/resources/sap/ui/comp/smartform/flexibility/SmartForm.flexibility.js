/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/ui/comp/smartform/flexibility/changes/RemoveGroup","sap/ui/comp/smartform/flexibility/changes/AddGroup","sap/ui/comp/smartform/flexibility/changes/MoveGroups","sap/ui/comp/smartform/flexibility/changes/RenameTitle","sap/ui/comp/smartform/flexibility/changes/CombineFields","sap/ui/comp/smartform/flexibility/changes/SplitField","sap/ui/comp/smartform/flexibility/changes/MoveFields","sap/ui/fl/apply/api/DelegateMediatorAPI"],function(e,i,r,t,a,o,l,m){"use strict";m.registerWriteDelegate({controlType:"sap.ui.comp.smartform.SmartForm",delegate:"sap/ui/comp/smartfield/flexibility/SmartFieldWriteDelegate"});m.registerWriteDelegate({controlType:"sap.ui.comp.smartform.Group",delegate:"sap/ui/comp/smartfield/flexibility/SmartFieldWriteDelegate"});return{removeGroup:e,addGroup:i,moveGroups:r,renameField:t,combineFields:a,splitField:o,moveControls:l}},true);
//# sourceMappingURL=SmartForm.flexibility.js.map