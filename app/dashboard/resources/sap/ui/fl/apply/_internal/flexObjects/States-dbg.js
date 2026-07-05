/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([], function() {
	"use strict";

	return {
		LifecycleState: {
			NEW: "NEW",
			PERSISTED: "PERSISTED",
			DELETED: "DELETED",
			DIRTY: "UPDATED", // deprecated, use UPDATED
			UPDATED: "UPDATED"
		},
		ApplyState: {
			INITIAL: "initial",
			APPLYING: "applying",
			REVERTING: "reverting",
			REVERT_FINISHED: "revert finished",
			APPLY_SUCCESSFUL: "apply successful",
			APPLY_FAILED: "apply failed"
		},
		Operations: {
			APPLY: "apply",
			REVERT: "revert"
		}
	};
});