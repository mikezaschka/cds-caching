sap.ui.define(["sap/ui/model/Filter", "sap/ui/model/FilterOperator"], function (Filter, FilterOperator) {
  "use strict";

  function cacheNameFilter(cacheName) {
    return new Filter({
      path: "cache",
      operator: FilterOperator.EQ,
      value1: cacheName
    });
  }
  function cacheAndIdFilter(cacheName, id) {
    return [new Filter({
      path: "cache",
      operator: FilterOperator.EQ,
      value1: cacheName
    }), new Filter({
      path: "ID",
      operator: FilterOperator.EQ,
      value1: id
    })];
  }
  function periodFilter(period) {
    return new Filter({
      path: "period",
      operator: FilterOperator.EQ,
      value1: period
    });
  }
  var __exports = {
    __esModule: true
  };
  __exports.cacheNameFilter = cacheNameFilter;
  __exports.cacheAndIdFilter = cacheAndIdFilter;
  __exports.periodFilter = periodFilter;
  return __exports;
});
//# sourceMappingURL=filters-dbg.js.map
