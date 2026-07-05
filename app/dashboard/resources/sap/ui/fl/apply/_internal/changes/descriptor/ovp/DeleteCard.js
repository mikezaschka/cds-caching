/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([],function(){"use strict";var e={applyChange(e,r){var t=r.getContent();var a=e["sap.ovp"].cards;if(t.cardId in a){delete a[t.cardId]}else{throw Error("The card to be deleted was not found")}return e}};return e});
//# sourceMappingURL=DeleteCard.js.map