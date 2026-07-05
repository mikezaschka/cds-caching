/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/integration/designtime/baseEditor/propertyEditor/BasePropertyEditor"],function(e){"use strict";var t=e.extend("sap.ui.fl.write._internal.fieldExtensibility.cap.editor.propertyEditor.booleanEditor.BooleanEditor",{xmlFragment:"sap.ui.fl.write._internal.fieldExtensibility.cap.editor.propertyEditor.booleanEditor.BooleanEditor",metadata:{library:"sap.ui.fl"},renderer:e.getMetadata().getRenderer().render});t.prototype._onChange=function(e){var t=!!e.getParameter("selected");this.setValue(t)};return t});
//# sourceMappingURL=BooleanEditor.js.map