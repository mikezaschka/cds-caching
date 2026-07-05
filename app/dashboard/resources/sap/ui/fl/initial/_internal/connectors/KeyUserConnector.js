/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/util/merge","sap/ui/fl/initial/_internal/connectors/BackendConnector","sap/ui/fl/Layer"],function(e,n,t){"use strict";var a="/flex/keyuser";var r="/v2";var s=e({},n,{layers:[t.CUSTOMER,t.PUBLIC],API_VERSION:r,ROUTES:{DATA:`${a+r}/data/`,SETTINGS:`${a+r}/settings`},isLanguageInfoRequired:true,loadFeatures(e){return n.loadFeatures.call(this,e).then(function(e){e.isContextSharingEnabled=true;return e})},loadFlexData(e){e.cacheable=true;return n.sendRequest.call(this,e).then(function(e){e.contents.map(function(e,n,t){t[n].changes=(e.changes||[]).concat(e.compVariants)});e.contents[0].cacheKey=e.cacheKey;return e.contents})}});return s});
//# sourceMappingURL=KeyUserConnector.js.map