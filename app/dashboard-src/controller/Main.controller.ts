import { ListBase$ItemPressEvent } from "sap/m/ListBase";
import BaseController from "./BaseController";
import { Route$PatternMatchedEvent } from "sap/ui/core/routing/Route";
import List from "sap/m/List";

/**
 * @namespace cds.plugin.caching.dashboard.controller
 */
export default class Main extends BaseController {

	public onInit(): void {
		this.getRouter().getRoute("main").attachPatternMatched(this.onRouteMatched, this);
	}

	public onRouteMatched(_event: Route$PatternMatchedEvent): void {
		this.getAppModel().setProperty("/layout", "OneColumn");
		(this.getView().byId("cachesList") as List).getBinding("items").refresh();
	}

	public onCacheSelect(event: ListBase$ItemPressEvent): void {
		const cache = event.getParameter("listItem").getBindingContext().getProperty("name");
		this.getRouter().navTo("cache", { cache: cache });
	}

	public onRefresh(): void {
		(this.getView().byId("cachesList") as List).getBinding("items").refresh();
	}

}
