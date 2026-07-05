/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/core/Lib","sap/ui/fl/apply/_internal/preprocessors/RegistrationDelegator","sap/ui/fl/initial/_internal/FlexConfiguration","sap/ui/fl/Utils","sap/ui/fl/Layer","sap/ui/fl/Scenario","sap/ui/fl/changeHandler/condenser/Classification","sap/ui/core/library","sap/m/library"],function(i,e,a,r,n,s,l){"use strict";var t=i.init({apiVersion:2,name:"sap.ui.fl",version:"1.136.0",controls:["sap.ui.fl.variants.VariantManagement","sap.ui.fl.util.IFrame"],dependencies:["sap.ui.core","sap.m"],designtime:"sap/ui/fl/designtime/library.designtime",extensions:{flChangeHandlers:{"sap.ui.fl.util.IFrame":"sap/ui/fl/util/IFrame"},"sap.ui.support":{publicRules:true}}});t.condenser={Classification:l};t.Scenario=s;e.registerAll();function o(){var i=r.getUshellContainer();if(i){return i.getLogonSystem().isTrial()}return false}if(o()){a.setFlexibilityServices([{connector:"LrepConnector",url:"/sap/bc/lrep",layers:[]},{connector:"LocalStorageConnector",layers:[n.CUSTOMER,n.PUBLIC,n.USER]}])}return t});
//# sourceMappingURL=library.js.map