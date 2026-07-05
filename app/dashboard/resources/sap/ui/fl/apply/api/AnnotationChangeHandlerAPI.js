/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/initial/_internal/changeHandlers/ChangeHandlerRegistration"],function(e){"use strict";const n={registerAnnotationChangeHandler(n){if(!n.changeType||!n.changeHandler){throw new Error("'changeType' and 'changeHandler' properties are required for registration!")}if(n.isDefaultChangeHandler){throw new Error("The API is not allowed to register default change handlers!")}e.registerAnnotationChangeHandler(n)},getAnnotationChangeHandler(n){if(!n.changeType){throw new Error("'changeType' property is required!")}return e.getAnnotationChangeHandler(n)}};return n});
//# sourceMappingURL=AnnotationChangeHandlerAPI.js.map