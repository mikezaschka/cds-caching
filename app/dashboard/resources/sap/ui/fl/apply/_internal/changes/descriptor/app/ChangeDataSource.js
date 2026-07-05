/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/util/changePropertyValueByPath","sap/ui/fl/util/DescriptorChangeCheck"],function(e,a){"use strict";var t=["UPDATE","UPSERT"];var r=["uri","settings/maxAge"];var n={};var o={applyChange(o,i){var u=o["sap.app"].dataSources;var s=i.getContent();a.checkEntityPropertyChange(s,r,t,n);if(u){var p=u[s.dataSourceId];if(p){e(s.entityPropertyChange,p)}else{throw new Error(`Nothing to update. DataSource with ID "${s.dataSourceId}" does not exist.`)}}else{throw Error("No sap.app/dataSource found in manifest.json")}return o}};return o});
//# sourceMappingURL=ChangeDataSource.js.map