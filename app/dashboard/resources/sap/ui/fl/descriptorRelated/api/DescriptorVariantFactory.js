/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/write/_internal/appVariant/AppVariantFactory"],function(e){"use strict";var r={};r.createNew=function(e){return r.createAppVariant(e)};r.createAppVariant=function(r){return e.prepareCreate(r)};r.createForExisting=function(r){return e.prepareUpdate({id:r})};r.createDeletion=function(r){return e.prepareDelete({id:r})};return r});
//# sourceMappingURL=DescriptorVariantFactory.js.map