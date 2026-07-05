/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/core/Element","sap/ui/mdc/enums/TableRowActionType"],e=>{"use strict";const t=e.extend("sap.ui.mdc.table.RowActionItem",{metadata:{library:"sap.ui.mdc",properties:{type:{type:"sap.ui.mdc.enums.TableRowActionType"},text:{type:"string"},icon:{type:"sap.ui.core.URI"},visible:{type:"boolean",defaultValue:true}},events:{press:{parameters:{bindingContext:{type:"sap.ui.model.Context"}}}}}});t.prototype._onPress=function(e){this.firePress({bindingContext:e.bindingContext})};return t});
//# sourceMappingURL=RowActionItem.js.map