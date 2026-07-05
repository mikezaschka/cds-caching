/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([],function(){"use strict";var r={applyChange(r,e){var a=e.getContent();var n=r["sap.ovp"].cards;if("card"in a&&Object.keys(a.card).length>0&&!(Object.keys(a.card)in n)){Object.assign(n,a.card)}else{throw Error("No new card found")}return r}};return r});
//# sourceMappingURL=AddNewCard.js.map