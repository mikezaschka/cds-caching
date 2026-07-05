/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/core/Element"],e=>{"use strict";const t=e.extend("sap.ui.mdc.field.MultiValueFieldItem",{metadata:{library:"sap.ui.mdc",properties:{key:{type:"any",byValue:true},description:{type:"string"}},defaultProperty:"key"}});t.prototype.bindProperty=function(t,r){if(t==="key"&&!r.formatter){r.targetType="raw"}e.prototype.bindProperty.apply(this,arguments)};return t});
//# sourceMappingURL=MultiValueFieldItem.js.map