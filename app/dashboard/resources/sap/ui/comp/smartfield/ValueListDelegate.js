/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/ui/base/Object","sap/base/util/deepEqual"],function(t,i){"use strict";var e=t.extend("sap.ui.comp.smartfield.ValueListDelegate",{constructor:function(i){t.apply(this,arguments);this.oValueListProvider=i}});e.prototype.fetchIDAndDescriptionCollectionIfRequired=function(){if(!this.oValueListProvider.bInitialised){return}this.oValueListProvider._calculateFilterInputData();if(!i(this.oValueListProvider._mLastFilterInputData,this.oValueListProvider.mFilterInputData)){this.oValueListProvider._fetchData();this.oValueListProvider._mLastFilterInputData=this.oValueListProvider.mFilterInputData}};e.prototype.destroy=function(){this.oValueListProvider=null};return e});
//# sourceMappingURL=ValueListDelegate.js.map