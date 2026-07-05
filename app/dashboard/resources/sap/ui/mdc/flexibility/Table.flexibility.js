/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["./SortFlex","./ColumnFlex","./ConditionFlex","./GroupFlex","./AggregateFlex","./xConfigFlex","sap/ui/fl/changeHandler/condenser/Classification"],(e,o,r,t,a,n,d)=>{"use strict";return{hideControl:"default",unhideControl:"default",addColumn:o.createAddChangeHandler(),removeColumn:o.createRemoveChangeHandler(),moveColumn:o.createMoveChangeHandler(),removeSort:e.removeSort,addSort:e.addSort,moveSort:e.moveSort,addCondition:r.addCondition,removeCondition:r.removeCondition,removeGroup:t.removeGroup,addGroup:t.addGroup,moveGroup:t.moveGroup,removeAggregate:a.removeAggregate,addAggregate:a.addAggregate,setColumnWidth:n.createSetChangeHandler({aggregation:"columns",property:"width"}),setShowDetails:n.createSetChangeHandler({aggregation:"type",property:"showDetails"}),setFixedColumnCount:n.createSetChangeHandler({aggregation:"type",property:"fixedColumnCount"})}});
//# sourceMappingURL=Table.flexibility.js.map