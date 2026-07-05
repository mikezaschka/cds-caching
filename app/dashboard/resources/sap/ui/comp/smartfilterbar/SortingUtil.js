/*
 * SAPUI5
 * (c) Copyright 2025 SAP SE. All rights reserved.
 */
sap.ui.define([],function(){"use strict";var e={sortByIndex:function(e){var n,r,t,i;if(!e||!e.length){return e}r=[];n=[];for(var s=0;s<e.length;s++){i=e[s];t=i.index;if(t>=0){n.push(i)}else{r.push(i)}}if(n.length){n=n.sort(function(e,n){return e.index-n.index});if(!r.length){r=n}else{for(var f=0;f<n.length;f++){i=n[f];if(i.index>=r.length){r.push(i)}else{r.splice(i.index,0,i)}}}}return r},groupSorting:function(e){var n=[];n=this.sortByIndex(e);for(var r=0;r<n.length;r++){if(n[r].fields){n[r].fields=this.sortByIndex(n[r].fields)}}return n},destroy:function(){}};return e},true);
//# sourceMappingURL=SortingUtil.js.map