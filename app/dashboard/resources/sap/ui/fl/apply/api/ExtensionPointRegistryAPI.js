/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/apply/_internal/extensionPoint/Registry"],function(n){"use strict";var e={getExtensionPointInfo(e){return n.getExtensionPointInfo(e.name,e.view)},getExtensionPointInfoByViewId(e){return n.getExtensionPointInfoByViewId(e.viewId)},getExtensionPointInfoByParentId(e){return n.getExtensionPointInfoByParentId(e.parentId)},addCreatedControlsToExtensionPointInfo(e){n.addCreatedControls(e.name,e.viewId,e.createdControlsIds)}};return e});
//# sourceMappingURL=ExtensionPointRegistryAPI.js.map