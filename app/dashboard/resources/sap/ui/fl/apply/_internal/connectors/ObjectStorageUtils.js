/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([],function(){"use strict";var e="sap.ui.fl";return{forEachObjectInStorage(r,t){var n=r.storage.getItems&&r.storage.getItems()||r.storage;return Promise.resolve(n).then(function(n){var a=Object.keys(n).map(function(a){var i=a.includes(e);if(!i){return}var s=n[a];var c=r.storage._itemsStoredAsObjects?s:JSON.parse(s);var o=true;if(r.reference){o=this.isSameReference(c,r.reference)}var u=true;if(r.layer){u=c.layer===r.layer}if(!o||!u){return}return t({changeDefinition:c,key:a})}.bind(this));return Promise.all(a)}.bind(this))},getAllFlexObjects(e){var r=[];return this.forEachObjectInStorage(e,function(e){r.push(e)}).then(function(){return r})},createFlexKey(r){if(r){return`${e}.${r}`}},createFlexObjectKey(e){return this.createFlexKey(e.fileName)},isSameReference(e,r){var t=r.endsWith(".Component")?r.replace(/\.Component$/,""):`${r}.Component`;return e.reference===r||e.reference===t}}});
//# sourceMappingURL=ObjectStorageUtils.js.map