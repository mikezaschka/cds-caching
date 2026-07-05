import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";

export function cacheNameFilter(cacheName: string): Filter {
	return new Filter({ path: "cache", operator: FilterOperator.EQ, value1: cacheName });
}

export function cacheAndIdFilter(cacheName: string, id: string): Filter[] {
	return [
		new Filter({ path: "cache", operator: FilterOperator.EQ, value1: cacheName }),
		new Filter({ path: "ID", operator: FilterOperator.EQ, value1: id }),
	];
}

export function periodFilter(period: string): Filter {
	return new Filter({ path: "period", operator: FilterOperator.EQ, value1: period });
}
