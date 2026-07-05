/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/Log","sap/base/util/LoaderExtensions","sap/base/util/merge","sap/ui/core/Component","sap/ui/core/Supportability","sap/ui/fl/interfaces/BaseLoadConnector"],function(e,r,a,o,n,s){"use strict";function t(a,s){var t=`${a.replace(/\./g,"/")}/changes/${s}.json`;var i=!!sap.ui.loader._.getModuleState(t);if(i||n.isDebugModeEnabled()||o.getComponentPreloadMode()==="off"){try{return r.loadResource(t)}catch(r){if(r.name.includes("SyntaxError")){e.error(r)}e.warning(`flexibility did not find a ${s}.json for the application: ${a}`)}}}const i=a({},s,{loadFlexData(e){var r=e.componentName;r||=e.reference.replace(/.Component/g,"");var a=t(r,"flexibility-bundle");if(a){a.changes=a.changes.concat(a.compVariants);delete a.compVariants;return Promise.resolve(a)}var o=t(r,"changes-bundle");if(o){return Promise.resolve({changes:o})}return Promise.resolve()},loadFeatures(){return Promise.resolve({})},loadVariantsAuthors(){return Promise.resolve({})}});return i});
//# sourceMappingURL=StaticFileConnector.js.map