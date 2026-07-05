import BaseController from "./BaseController";

/**
 * @namespace cds.plugin.caching.dashboard.controller
 */
export default class App extends BaseController {

	public onInit(): void {
		this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
	}

}
