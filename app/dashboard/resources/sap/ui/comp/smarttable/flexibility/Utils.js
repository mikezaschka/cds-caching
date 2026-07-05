/*!
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define(["sap/ui/fl/Utils","sap/ui/core/util/reflection/JsControlTreeModifier","sap/ui/base/ManagedObjectMetadata"],function(e,t,n){"use strict";var r={getAppComponentForControl:function(t){return e.getAppComponentForControl(t)},getSelectorForControl:function(e,o){if(!o&&!(o===null)){o=r.getAppComponentForControl(e)}if(e&&e.isA&&e.isA("sap.ui.core.Control")&&!n.isGeneratedId(e.getId())){return t.getSelector(e,o)}else{return null}},parseChangeContent:function(e,t){if(typeof e==="string"){try{e=e.replace(/(\\{)/g,"{").replace(/(\\})/g,"}");e=JSON.parse(e);if(t){t(e)}}catch(t){e=null}}return e}};return r});
//# sourceMappingURL=Utils.js.map