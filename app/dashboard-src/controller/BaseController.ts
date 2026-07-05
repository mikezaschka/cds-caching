import Controller from "sap/ui/core/mvc/Controller";
import UIComponent from "sap/ui/core/UIComponent";
import AppComponent from "../Component";
import Model from "sap/ui/model/Model";
import JSONModel from "sap/ui/model/json/JSONModel";
import ODataModel from "sap/ui/model/odata/v4/ODataModel";
import ResourceModel from "sap/ui/model/resource/ResourceModel";
import ResourceBundle from "sap/base/i18n/ResourceBundle";
import Router from "sap/ui/core/routing/Router";
import History from "sap/ui/core/routing/History";

/**
 * @namespace cds.plugin.caching.dashboard.controller
 */
export default abstract class BaseController extends Controller {

	public onInit(): void {

	}

	/**
	 * Convenience method for accessing the component of the controller's view.
	 * @returns The component of the controller's view
	 */
	public getOwnerComponent(): AppComponent {
		return super.getOwnerComponent() as AppComponent;
	}

	/**
	 * Convenience method to get the components' router instance.
	 * @returns The router instance
	 */
	public getRouter(): Router {
		return UIComponent.getRouterFor(this);
	}

	/**
	 * Convenience method for getting the i18n resource bundle of the component.
	 * @returns The i18n resource bundle of the component
	 */
	public getResourceBundle(): Promise<ResourceBundle> {
		const model = this.getOwnerComponent().getModel("i18n") as ResourceModel;
		return model.getResourceBundle() as Promise<ResourceBundle>;
	}

	/**
	 * Returns a translated string from the i18n bundle (ResourceModel is async).
	 */
	public async i18nText(key: string, args?: (string | number)[]): Promise<string> {
		const bundle = await this.getResourceBundle();
		return args && args.length
			? bundle.getText(key, args)
			: bundle.getText(key);
	}

	/**
	 * Convenience method for getting the view model by name in every controller of the application.
	 * @param name The model name
	 * @returns The model instance
	 */
	public getModel(name?: string): Model {
		return this.getView().getModel(name);
	}

	/**
	 * Returns the application JSON model.
	 */
	protected getAppModel(): JSONModel {
		return this.getModel("app") as JSONModel;
	}

	/**
	 * Returns the default OData V4 model.
	 */
	protected getODataModel(): ODataModel {
		return this.getModel() as ODataModel;
	}

	/**
	 * Convenience method for setting the view model in every controller of the application.
	 * @param model The model instance
	 * @param name The model name
	 * @returns The current base controller instance
	 */
	public setModel(model: Model, name?: string): BaseController {
		this.getView().setModel(model, name);
		return this;
	}

	/**
	 * Convenience method for triggering the navigation to a specific target.
	 * @param name Target name
	 * @param parameters Navigation parameters
	 * @param replace Defines if the hash should be replaced (no browser history entry) or set (browser history entry)
	 */
	public navTo(name: string, parameters?: object, replace?: boolean): void {
		this.getRouter().navTo(name, parameters, undefined, replace);
	}

	/**
	 * Convenience event handler for navigating back.
	 * It there is a history entry we go one step back in the browser history
	 * If not, it will replace the current entry of the browser history with the main route.
	 */
	public onNavBack(): void {
		const previousHash = History.getInstance().getPreviousHash();
		if (previousHash !== undefined) {
			window.history.go(-1);
		} else {
			this.getRouter().navTo("main", {}, undefined, true);
		}
	}
}
