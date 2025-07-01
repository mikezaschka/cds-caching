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
	}

	public onCacheSelect(event: ListBase$ItemPressEvent): void {
		const cache = event.getParameter("listItem").getBindingContext().getProperty("name");
		this.getRouter().navTo("cache", { cache: cache });
	}

	public onRefreshAllCaches(): void {
		// Refresh the caches list
		const model = this.getModel() as ODataModel;
		model.refresh();
		MessageBox.success("Cache list refreshed");
	}

	public onClearAllCaches(): void {
		MessageBox.confirm("Are you sure you want to clear all caches? This action cannot be undone.", {
			actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
			emphasizedAction: MessageBox.Action.OK,
			onClose: (action: string) => {
				if (action === MessageBox.Action.OK) {
					// TODO: Implement clear all caches functionality
					MessageBox.success("All caches cleared");
				}
			}
		});
	}
}
