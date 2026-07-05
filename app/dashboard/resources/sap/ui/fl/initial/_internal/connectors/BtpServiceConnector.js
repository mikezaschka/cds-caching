/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/util/merge","sap/ui/fl/initial/_internal/connectors/KeyUserConnector","sap/ui/fl/initial/_internal/connectors/Utils","sap/ui/fl/Layer"],function(n,e,t,i){"use strict";var a="/flex/all";var s="/v3";const r=`${a}${s}`;const o=n({},e,{layers:[i.CUSTOMER,i.PUBLIC,i.USER],ROOT:r,ROUTES:{DATA:`${r}/data`,VARIANTDATA:`${r}/variantdata`,SETTINGS:`${r}/settings`},loadFeatures(n){return e.loadFeatures.call(this,n).then(function(n){n.isCondensingEnabled=n.isCondensingEnabledOnBtp;delete n.isCondensingEnabledOnBtp;return n})},loadFlVariant(n){const e={id:n.variantReference,version:n.version};if(this.isLanguageInfoRequired){t.addLanguageInfo(e)}const i=t.getUrl(this.ROUTES.VARIANTDATA,n,e);return t.sendRequest(i,"GET",{initialConnector:this}).then(function(n){return n.response})}});return o});
//# sourceMappingURL=BtpServiceConnector.js.map