/*!
* OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
*/
sap.ui.define(["sap/base/config"],e=>{"use strict";const i=e.getWritableInstance();const t={getFlexibilityServices(){const e=[{url:"/sap/bc/lrep",connector:"LrepConnector"}];const t=i.get({name:"sapUiFlexibilityServices",type:i=>{if(typeof i==="string"){if(i===""){return[]}if(i[0]==="/"){e[0].url=i;i=e}else{i=JSON.parse(i)}}return i||[]},defaultValue:e,external:false});return t},setFlexibilityServices(e){i.set("sapUiFlexibilityServices",e.slice())}};return t});
//# sourceMappingURL=FlexConfiguration.js.map