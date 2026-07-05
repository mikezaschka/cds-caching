/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/util/merge","sap/base/util/restricted/_pick","sap/ui/fl/initial/_internal/connectors/Utils","sap/ui/fl/interfaces/BaseLoadConnector"],function(e,t,n,s){"use strict";const i=e({},s,{xsrfToken:undefined,settings:undefined,sendRequest(e){var s=t(e,["version","allContexts"]);if(this.isLanguageInfoRequired){n.addLanguageInfo(s)}var i=n.getUrl(this.ROUTES.DATA,e,s);return n.sendRequest(i,"GET",{initialConnector:this,xsrfToken:this.xsrfToken,cacheable:e.cacheable}).then(function(e){var t=e.response;if(e.etag){t.cacheKey=e.etag}if(t.settings){this.settings=t.settings}return t}.bind(this))},loadFeatures(e){if(this.settings){return Promise.resolve({response:this.settings})}var t=n.getUrl(this.ROUTES.SETTINGS,e);return n.sendRequest(t,"GET",{initialConnector:this}).then(function(e){return e.response})},loadFlexData(e){e.cacheable=true;return this.sendRequest(e).then(function(e){e.changes=e.changes.concat(e.compVariants||[]);return e})}});return i});
//# sourceMappingURL=BackendConnector.js.map