/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/util/ObjectPath"],function(r){"use strict";var t={applyChange(t,e){var a=e.getContent();var o=a.entityPropertyChange.operation==="UPSERT";var n=t["sap.ovp"].cards;var p=a.entityPropertyChange;if(Array.isArray(p)){throw Error("Expected value for oPropertyChange was an object")}if(!o){throw Error("This Operation is not supported")}if(a.cardId in n&&"propertyPath"in p){r.set([a.cardId,p.propertyPath],p.propertyValue,n)}else{throw Error("Change card settings was not found")}return t}};return t});
//# sourceMappingURL=ChangeCard.js.map