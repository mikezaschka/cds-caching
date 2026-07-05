/*!
* OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
*/
sap.ui.define(["sap/ui/fl/apply/_internal/extensionPoint/Processor","sap/base/util/merge"],function(n,t){"use strict";function e(i,o){var r=t({defaultContent:[]},i);return n.registerExtensionPoint(r).then(n.createDefaultContent.bind(this,i,o,e,[])).then(n.addDefaultContentToExtensionPointInfo.bind(this,r,o))}var i={applyExtensionPoint(n){return e(n,false)}};return i});
//# sourceMappingURL=Processor.js.map