/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/integration/designtime/baseEditor/propertyEditor/BasePropertyEditor","sap/ui/integration/designtime/baseEditor/propertyEditor/dateEditor/DateEditor","sap/ui/core/format/DateFormat"],function(t,e,r){"use strict";const i=e.extend("sap.ui.fl.write._internal.fieldExtensibility.cap.editor.propertyEditor.timeEditor.TimeEditor",{xmlFragment:"sap.ui.fl.write._internal.fieldExtensibility.cap.editor.propertyEditor.timeEditor.TimeEditor",metadata:{library:"sap.ui.fl"},renderer:t.getMetadata().getRenderer().render});i.configMetadata={...e.configMetadata,pattern:{defaultValue:"HH:mm:ss"},utc:{defaultValue:false}};i.prototype.getDefaultValidators=function(){return{...e.prototype.getDefaultValidators.call(this)}};i.prototype.getFormatterInstance=function(t){return r.getTimeInstance(t||{pattern:"HH:mm:ss.SSSS"})};return i});
//# sourceMappingURL=TimeEditor.js.map