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
			MessageBox.warning(await this.i18nText("msgNoCacheSelected"));
			// Revert the switch
			(this.getModel("app") as JSONModel).setProperty("/enableStatistics", !enabled);
			return;
		}

		try {
			// Show loading state
			MessageToast.show(await this.i18nText("msgUpdatingStatsConfig"));
			
			const success = await this.statisticsService.setStatisticsEnabled(cacheName, enabled);
			if (success) {
				MessageToast.show(await this.i18nText(enabled ? "msgStatsEnabled" : "msgStatsDisabled"));
				// Reload the configuration to reflect the change
				await this.loadRuntimeConfiguration(cacheName);
			} else {
				MessageToast.show(await this.i18nText("msgFailedUpdateStatsConfig"));
				// Revert the switch
				(this.getModel("app") as JSONModel).setProperty("/enableStatistics", !enabled);
			}
		} catch (error) {
			console.error("Error updating statistics configuration:", error);
			MessageToast.show(await this.i18nText("msgErrorUpdateStatsConfig"));
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
			MessageBox.warning(await this.i18nText("msgNoCacheSelected"));
			// Revert the switch
			(this.getModel("app") as JSONModel).setProperty("/enableKeyTracking", !enabled);
			return;
		}

		try {
			// Show loading state
			MessageToast.show(await this.i18nText("msgUpdatingKeyTracking"));
			
			const success = await this.statisticsService.setKeyTrackingEnabled(cacheName, enabled);
			if (success) {
				MessageToast.show(await this.i18nText(enabled ? "msgKeyTrackingEnabled" : "msgKeyTrackingDisabled"));
				// Reload the configuration to reflect the change
				await this.loadRuntimeConfiguration(cacheName);
			} else {
				MessageToast.show(await this.i18nText("msgFailedKeyTracking"));
				// Revert the switch
				(this.getModel("app") as JSONModel).setProperty("/enableKeyTracking", !enabled);
			}
		} catch (error) {
			console.error("Error updating key tracking configuration:", error);
			MessageToast.show(await this.i18nText("msgErrorKeyTracking"));
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
				MessageBox.warning(await this.i18nText("msgNoCacheSelected"));
				return;
			}

			const success = await this.statisticsService.persistStatistics(cacheName);
			if (success) {
				MessageToast.show(await this.i18nText("msgStatsPersisted"));
			} else {
				MessageToast.show(await this.i18nText("msgFailedPersistStats"));
			}
		} catch (error) {
			console.error("Error persisting statistics:", error);
			MessageToast.show(await this.i18nText("msgErrorPersistStats"));
		}
	}

}
