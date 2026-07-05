/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/changeHandler/condenser/Classification"],function(t){"use strict";const n={};n.applyChange=function(t){const n=t.getContent();const e={path:n.annotationPath};const o=t.getText("annotationText")||n.value;const a=n.objectTemplateInfo;if(a){e.value=JSON.parse(a.templateAsString.replace(a.placeholder,o))}else{e.value=o}return e};n.revertChange=function(){};n.completeChangeContent=function(t,n){const e={annotationPath:n.content.annotationPath};if(n.content.objectTemplateInfo){e.objectTemplateInfo=n.content.objectTemplateInfo}if(n.content.text){t.setText("annotationText",n.content.text)}else{e.value=n.content.value}t.setContent(e)};n.getCondenserInfo=function(n,e){return{affectedControl:e.appComponent,classification:t.LastOneWins,uniqueKey:`${n.getContent().annotationPath}_${n.getChangeType()}`}};return n});
//# sourceMappingURL=ChangeAnnotation.js.map