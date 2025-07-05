import { ListBase$ItemPressEvent } from "sap/m/ListBase";
import BaseController from "./BaseController";
import MessageBox from "sap/m/MessageBox";
import ODataModel from "sap/ui/model/odata/v4/ODataModel";
import { Route$PatternMatchedEvent } from "sap/ui/core/routing/Route";

/**
 * @namespace cds.plugin.caching.dashboard.controller
 */
export default class Main extends BaseController {

	public onInit(): void {
		this.getRouter().getRoute("main").attachPatternMatched(this.onRouteMatched, this);
	}

	public onRouteMatched(event: Route$PatternMatchedEvent): void {
		// Set layout to one column for main view
		(<any>this.getModel("app")).setProperty("/layout", "OneColumn");
		this.getView().byId("cachesList").getBinding("items").refresh();
	}

	public onCacheSelect(event: ListBase$ItemPressEvent): void {
		const cache = event.getParameter("listItem").getBindingContext().getProperty("name");
		this.getRouter().navTo("cache", { cache: cache });
	}

	public onRefresh(): void {
		this.getView().byId("cachesList").getBinding("items").refresh();
	}

}
