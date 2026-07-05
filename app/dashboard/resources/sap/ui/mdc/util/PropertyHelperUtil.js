/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/core/Lib","sap/ui/VersionInfo","sap/ui/base/Object"],(i,a,n)=>{"use strict";const t={};t.checkValidationExceptions=async function(){if(this.bValidationException===null||this.bValidationException===undefined){this.bValidationException=await this._checkValidationExceptions()}return Promise.resolve(this.bValidationException)};t._checkValidationExceptions=async function(){const n=["sap.fe.core","sap.fe.macros","sap.sac.df"];const t=n.filter(a=>i.isLoaded(a));const e=await a.load();const o=window["sap-ui-mdc-config"]&&window["sap-ui-mdc-config"].disableStrictPropertyInfoValidation;const s=new URLSearchParams(window.location.search).get("sap-ui-xx-disableStrictPropertyValidation")=="true";const c=t.includes("sap.fe.core")||t.includes("sap.fe.macros");const r=t.includes("sap.sac.df");const d=new URLSearchParams(window.location.search).get("sap-ui-xx-enableStrictPropertyValidation")=="true";const p=e.version.indexOf("2.")===0;return(o||s||c||r)&&!d&&!p};return t});
//# sourceMappingURL=PropertyHelperUtil.js.map