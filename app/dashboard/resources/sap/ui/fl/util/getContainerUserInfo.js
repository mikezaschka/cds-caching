/*!
 * OpenUI5
 * (c) Copyright 2025 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/Utils","sap/base/Log"],function(e,r){"use strict";function t(e){if(!e){return""}return e}return function(){var n=e.getUshellContainer();if(n){return e.getUShellService("UserInfo").then(function(e){if(!e){return{}}var r=e.getUser();if(!r){return{}}var n=t(r.getEmail());var i;if(n){i=t(/@(.*)/.exec(n)[1])}else{i=""}return{fullName:t(r.getFullName()),firstName:t(r.getFirstName()),lastName:t(r.getLastName()),email:n,domain:i}}).catch(function(e){r.error(`Unexpected exception when reading shell user info: ${e.toString()}`);return{}})}return Promise.resolve({})}});
//# sourceMappingURL=getContainerUserInfo.js.map