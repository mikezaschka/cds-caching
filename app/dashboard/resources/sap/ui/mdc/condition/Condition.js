/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/mdc/enums/ConditionValidated","sap/ui/mdc/enums/OperatorName"],(n,t)=>{"use strict";const e=function(n){return JSON.stringify(Object.assign({},n,{isEmpty:undefined}),(n,t)=>t===undefined?"[undefined]":t)};const i={createItemCondition:function(e,i,o,r,a){let s=n.NotValidated;const u=[e,i];if(i===null||i===undefined){u.pop()}else{s=n.Validated}return this.createCondition(t.EQ,u,o,r,s,a)},createCondition:function(n,t,e,i,o,r){const a={operator:n,values:t,isEmpty:null,validated:o};if(e){a.inParameters=e}if(i){a.outParameters=i}if(r){a.payload=r}return a},compareConditions:function(n,t){const i=e(n);const o=e(t);return i===o},_removeEmptyConditions:function(n){for(let t=n.length-1;t>-1;t--){if(n[t].isEmpty){n.splice(parseInt(t),1)}}return n},_removeInitialFlags:function(n){for(let t=n.length-1;t>-1;t--){if(n[t].isInitial){delete n[t].isInitial}}return n}};return i},true);
//# sourceMappingURL=Condition.js.map