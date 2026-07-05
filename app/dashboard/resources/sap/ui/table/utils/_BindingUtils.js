/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([],function(){"use strict";const t={TableUtils:null,metadataLoaded:function(t){const a=t.getBinding();const e=a?a.getModel():null;let n=null;let d=null;const o=new Promise(function(t,a){n=t;d=a});if(!e){d();return o}if(e.metadataLoaded){e.metadataLoaded().then(function(){n()})}else if(e.attachMetadataLoaded){if(e.oMetadata&&e.oMetadata.isLoaded()){n()}else{e.attachMetadataLoaded(function(){n()})}}return o}};return t},true);
//# sourceMappingURL=_BindingUtils.js.map