import MessageBox from "sap/m/MessageBox";
import BaseController from "./BaseController";
import { IconTabBar$SelectEvent } from "sap/m/IconTabBar";
import CacheStatisticsService from "../service/CacheStatisticsService";
import ODataModel from "sap/ui/model/odata/v4/ODataModel";
import JSONModel from "sap/ui/model/json/JSONModel";
import MessageToast from "sap/m/MessageToast";

/**
 * @namespace cds.plugin.caching.dashboard.controller
 */
export default class App extends BaseController {
	private statisticsService: CacheStatisticsService;


	public onInit(): void {

		// Get the OData model from the component
		const odataModel = this.getOwnerComponent().getModel() as ODataModel;
		this.statisticsService = new CacheStatisticsService(odataModel);

		// apply content density mode to root view
		this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
	}

	public onSelectionChange(oEvent: IconTabBar$SelectEvent): void {
		const key = oEvent.getParameter("selectedKey");
		this.getRouter().navTo(key);
	}

	/**
	 * Handle cache selection change
	 */
	public async onCacheChange(): Promise<void> {
		const selectedCache = this.getModel("app").getProperty("/selectedCache");
		if (selectedCache) {
			await this.loadRuntimeConfiguration(selectedCache);
		}
	}

	/**
	 * Load runtime configuration for the selected cache
	 */
	private async loadRuntimeConfiguration(cacheName: string): Promise<void> {
		try {
			const config = await this.statisticsService.getRuntimeConfiguration(cacheName);
			(this.getModel("app") as JSONModel).setProperty("/enableStatistics", config.enableStatistics);
			(this.getModel("app") as JSONModel).setProperty("/enableKeyTracking", config.enableKeyTracking);
		} catch (error) {
			console.error("Error loading runtime configuration:", error);
			// Set defaults if loading fails
			(this.getModel("app") as JSONModel).setProperty("/enableStatistics", false);
			(this.getModel("app") as JSONModel).setProperty("/enableKeyTracking", false);
		}
	}

	/**
	 * Handle statistics enable/disable switch change
	 */
	public async onEnableStatisticsChange(oEvent: any): Promise<void> {
		const enabled = oEvent.getParameter("state");
		const cacheName = this.getModel("app").getProperty("/selectedCache");
		
		if (!cacheName) {
			MessageBox.warning("No cache selected");
			// Revert the switch
			(this.getModel("app") as JSONModel).setProperty("/enableStatistics", !enabled);
			return;
		}

		try {
			// Show loading state
			MessageToast.show("Updating statistics configuration...");
			
			const success = await this.statisticsService.setStatisticsEnabled(cacheName, enabled);
			if (success) {
				MessageToast.show(`Statistics ${enabled ? 'enabled' : 'disabled'} successfully`);
				// Reload the configuration to reflect the change
				await this.loadRuntimeConfiguration(cacheName);
			} else {
				MessageToast.show("Failed to update statistics configuration");
				// Revert the switch
				(this.getModel("app") as JSONModel).setProperty("/enableStatistics", !enabled);
			}
		} catch (error) {
			console.error("Error updating statistics configuration:", error);
			MessageToast.show("Error updating statistics configuration");
			// Revert the switch
			(this.getModel("app") as JSONModel).setProperty("/enableStatistics", !enabled);
		}
	}

	/**
	 * Handle key tracking enable/disable switch change
	 */
	public async onEnableKeyTrackingChange(oEvent: any): Promise<void> {
		const enabled = oEvent.getParameter("state");
		const cacheName = this.getModel("app").getProperty("/selectedCache");
		
		if (!cacheName) {
			MessageBox.warning("No cache selected");
			// Revert the switch
			(this.getModel("app") as JSONModel).setProperty("/enableKeyTracking", !enabled);
			return;
		}

		try {
			// Show loading state
			MessageToast.show("Updating key tracking configuration...");
			
			const success = await this.statisticsService.setKeyTrackingEnabled(cacheName, enabled);
			if (success) {
				MessageToast.show(`Key tracking ${enabled ? 'enabled' : 'disabled'} successfully`);
				// Reload the configuration to reflect the change
				await this.loadRuntimeConfiguration(cacheName);
			} else {
				MessageToast.show("Failed to update key tracking configuration");
				// Revert the switch
				(this.getModel("app") as JSONModel).setProperty("/enableKeyTracking", !enabled);
			}
		} catch (error) {
			console.error("Error updating key tracking configuration:", error);
			MessageToast.show("Error updating key tracking configuration");
			// Revert the switch
			(this.getModel("app") as JSONModel).setProperty("/enableKeyTracking", !enabled);
		}
	}

	/**
	 * Persist statistics to database
	 */
	public async onPersistStatistics(): Promise<void> {
		try {
			const cacheName = this.getModel("app").getProperty("/selectedCache");
			if (!cacheName) {
				MessageBox.warning("No cache selected");
				return;
			}

			const success = await this.statisticsService.persistStatistics(cacheName);
			if (success) {
				MessageToast.show("Statistics persisted successfully");
			} else {
				MessageToast.show("Failed to persist statistics");
			}
		} catch (error) {
			console.error("Error persisting statistics:", error);
			MessageToast.show("Error persisting statistics");
		}
	}

}
