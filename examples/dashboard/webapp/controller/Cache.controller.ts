import MessageBox from "sap/m/MessageBox";
import BaseController from "./BaseController";
import ODataModel from "sap/ui/model/odata/v4/ODataModel";
import JSONModel from "sap/ui/model/json/JSONModel";
import { Route$PatternMatchedEvent } from "sap/ui/core/routing/Route";
import Table, { Table$RowSelectionChangeEvent } from "sap/ui/table/Table";
import MessageToast from "sap/m/MessageToast";
import Context from "sap/ui/model/odata/v4/Context";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import { Button$PressEvent } from "sap/m/Button";
import Fragment from "sap/ui/core/Fragment";
import Popover from "sap/m/Popover";

/**
 * @namespace cds.plugin.caching.dashboard.controller
 */
export default class Cache extends BaseController {
    private uiModel: JSONModel;

    public onInit(): void {
        super.onInit();

        // Create a JSON model for UI data binding
        this.uiModel = new JSONModel({
            selectedTab: "main",
            statistics: [],
            loading: false,
            loadingEntries: false,
            showEntriesTable: false,
            cacheEntries: [],

            // Create
            createKey: "",
            createValue: "",
            createTtl: 3600,

            // Get
            getKey: "",
            getValue: "",

            // Delete
            deleteKey: "",

            // Metrics
            metricsEnabled: false,
            keyMetricsEnabled: false,
        });
        this.getView().setModel(this.uiModel, "ui");


        this.getRouter().getRoute("cache").attachPatternMatched(this.onRouteMatched, this);

    }

    public onRouteMatched(event: Route$PatternMatchedEvent): void {
        const { cache } = event.getParameter("arguments") as { cache: string };
        (<JSONModel>this.getModel("app")).setProperty("/selectedCache", cache);
        (<JSONModel>this.getModel("app")).setProperty("/layout", "TwoColumnsMidExpanded");

        this.getView().bindElement({
            path: "/Caches('" + cache + "')",
            events: {
                change: (event: any) => {
                    const context = this.getView().getElementBinding().getBoundContext();
                    if (context) {
                        const cache = context.getProperty("configuration");
                        this.uiModel.setProperty("/config", cache);
                        this.loadStatistics();
                        this.loadKeyMetricsData();
                    }
                }
            }
        });
    }

    /**
     * Load statistics based on current filters
     */
    private async loadStatistics(refresh: boolean = false): Promise<void> {
        const table = this.getView().byId("metricsTable") as Table;
        const filter = new Filter("cache", FilterOperator.EQ, (<JSONModel>this.getModel("app")).getProperty("/selectedCache"));
        if (table.getBinding("rows").isSuspended()) {
            table.getBinding("rows").resume();
        }
        if (refresh) {
            (<ODataListBinding>table.getBinding("rows")).refresh();
        } else {
            (<ODataListBinding>table.getBinding("rows")).filter(filter);
        }
    }

    /**
     * Load key tracking data
     */
    async loadKeyMetricsData(refresh: boolean = false): Promise<void> {
        const table = this.getView().byId("keyMetricsTable") as Table;
        const filter = new Filter("cache", FilterOperator.EQ, (<JSONModel>this.getModel("app")).getProperty("/selectedCache"));
        if (table.getBinding("rows").isSuspended()) {
            table.getBinding("rows").resume();
        }
        if (refresh) {
            (<ODataListBinding>table.getBinding("rows")).refresh();
        } else {
            (<ODataListBinding>table.getBinding("rows")).filter(filter);
        }
    }


    /**
     * Load cache entries
     */
    public async onLoadCacheEntries(): Promise<void> {
        const cacheContext = this.getView().getElementBinding().getBoundContext() as Context;

        try {
            this.uiModel.setProperty("/loadingEntries", true);
            this.uiModel.setProperty("/showEntriesTable", true);
            this.uiModel.setSizeLimit(100_000);

            // Call the backend to get cache entries
            const model = this.getModel() as ODataModel;
            const context = model.bindContext(`plugin.cds_caching.CachingApiService.getEntries(...)`, cacheContext);
            await context.invoke();
            const { value: entries } = await context.requestObject();
            for (const entry of entries) {
                entry.tags = entry.tags.join(", ");
            }

            this.uiModel.setProperty("/cacheEntries", entries);

        } catch (error) {
            console.error("Error loading cache entries:", error);
            MessageBox.error("Failed to load cache entries");
        } finally {
            this.uiModel.setProperty("/loadingEntries", false);
        }
    }

    /**
     * Handle statistics row selection
     */
    public onMetricsRowSelect(event: Table$RowSelectionChangeEvent): void {
        const selectedRow = event.getParameter("rowContext");
        if (selectedRow) {
            const metric = selectedRow.getObject() as any;
            const cacheName = this.getView().getElementBinding().getBoundContext().getProperty("name");

            // Navigate to single metric view
            this.getRouter().navTo("singleMetric", {
                cache: cacheName,
                metricId: metric.ID
            });

            // Set layout to three columns
            (<JSONModel>this.getModel("app")).setProperty("/layout", "ThreeColumnsEndExpanded");
        }
    }

    /**
     * Set cache entry
     */
    public async onSetKey(): Promise<void> {
        const cacheContext = this.getView().getElementBinding().getBoundContext() as Context;
        const key = this.uiModel.getProperty("/createKey");
        const value = this.uiModel.getProperty("/createValue");
        const ttl = this.uiModel.getProperty("/createTtl");

        if (!key || !value) {
            MessageBox.error("Please provide both key and value");
            return;
        }

        try {
            const model = this.getModel() as ODataModel;
            const context = model.bindContext(`plugin.cds_caching.CachingApiService.setEntry(...)`, cacheContext);
            context.setParameter("key", key);
            context.setParameter("value", value);
            context.setParameter("ttl", ttl);
            await context.invoke();


            MessageToast.show("Cache entry created successfully");

            // Clear form
            this.uiModel.setProperty("/createKey", "");
            this.uiModel.setProperty("/createValue", "");
            this.uiModel.setProperty("/createTtl", 3600);

        } catch (error) {
            console.error("Error setting cache entry:", error);
            MessageBox.error("Failed to create cache entry");
        }
    }

    /**
     * Get cache entry
     */
    public async onGetKey(): Promise<void> {
        const cacheContext = this.getView().getElementBinding().getBoundContext() as Context;
        const key = this.uiModel.getProperty("/getKey");

        if (!key) {
            MessageBox.error("Please provide a key");
            return;
        }

        try {
            const model = this.getModel() as ODataModel;
            const action = model.bindContext(`plugin.cds_caching.CachingApiService.getEntry(...)`, cacheContext);
            action.setParameter("key", key);
            await action.invoke();

            const result = await action.requestObject();
            this.uiModel.setProperty("/getValue", result.value || "Not found");

        } catch (error) {
            console.error("Error getting cache entry:", error);
            this.uiModel.setProperty("/getValue", "Error: Entry not found or error occurred");
        }
    }

    /**
     * Delete cache entry
     */
    public async onDeleteKey(): Promise<void> {
        const cacheContext = this.getView().getElementBinding().getBoundContext() as Context;
        const key = this.uiModel.getProperty("/deleteKey");

        if (!key) {
            MessageBox.error("Please provide a key");
            return;
        }

        try {
            const model = this.getModel() as ODataModel;
            const context = model.bindContext(`plugin.cds_caching.CachingApiService.deleteEntry(...)`, cacheContext);
            context.setParameter("key", key);
            await context.invoke();

            MessageToast.show("Cache entry deleted successfully");

            // Clear form
            this.uiModel.setProperty("/deleteKey", "");

        } catch (error) {
            console.error("Error deleting cache entry:", error);
            MessageBox.error("Failed to delete cache entry");
        }
    }

    /**
     * Enable/disable statistics
     */
    public async onEnableMetricsChange(event: any): Promise<void> {
        const enabled = event.getParameter("state");
        const cacheContext = this.getView().getElementBinding().getBoundContext() as Context;

        try {
            const model = this.getModel() as ODataModel;
            const context = model.bindContext(`plugin.cds_caching.CachingApiService.setMetricsEnabled(...)`, cacheContext);
            context.setParameter("enabled", enabled);
            await context.invoke();

            MessageToast.show(`Metrics ${enabled ? 'enabled' : 'disabled'} successfully`);
        } catch (error) {
            console.error("Error setting metrics enabled:", error);
            MessageBox.error("Failed to update metrics setting");
            // Revert the switch
            this.uiModel.setProperty("/enableMetrics", !enabled);
        }
    }

    /**
     * Enable/disable key tracking
     */
    public async onEnableKeyMetricsChange(event: any): Promise<void> {
        const enabled = event.getParameter("state");
        const cacheContext = this.getView().getElementBinding().getBoundContext() as Context;

        try {
            const model = this.getModel() as ODataModel;
            const context = model.bindContext(`plugin.cds_caching.CachingApiService.setKeyMetricsEnabled(...)`, cacheContext);
            context.setParameter("enabled", enabled);
            await context.invoke();

            MessageToast.show(`Key metrics ${enabled ? 'enabled' : 'disabled'} successfully`);

        } catch (error) {
            console.error("Error setting key metrics enabled:", error);
            MessageBox.error("Failed to update key metrics setting");
            // Revert the switch
            this.uiModel.setProperty("/enableKeyMetrics", !enabled);
        }
    }

    /**
     * Clear cache
     */
    public async onClearCache(): Promise<void> {
        const cacheContext = this.getView().getElementBinding().getBoundContext() as Context;

        MessageBox.confirm("Are you sure you want to clear this cache? This action cannot be undone.", {
            actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
            emphasizedAction: MessageBox.Action.OK,
            onClose: async (action: string) => {
                if (action === MessageBox.Action.OK) {
                    try {
                        const model = this.getModel() as ODataModel;
                        const context = model.bindContext(`plugin.cds_caching.CachingApiService.clear(...)`, cacheContext);
                        await context.invoke();

                        MessageBox.success("Cache cleared successfully");

                    } catch (error) {
                        console.error("Error clearing cache:", error);
                        MessageBox.error("Failed to clear cache");
                    }
                }
            }
        });
    }

    /**
     * Handle refresh button press
     */
    public async onRefresh(): Promise<void> {
        if (this.getView().getElementBinding().getBoundContext()) {
            await this.loadStatistics(true);
            await this.loadKeyMetricsData(true);
        }
    }

    public handleClose(): void {
        this.getRouter().navTo("main");
    }

    public handleFullScreen(): void {
        (<JSONModel>this.getModel("app")).setProperty("/layout", "MidColumnFullScreen");
    }

    public handleExitFullScreen(): void {
        (<JSONModel>this.getModel("app")).setProperty("/layout", "TwoColumnsMidExpanded");
    }

    /**
     * Handle key row selection
     */
    public onKeyMetricsRowSelect(event: any): void {

        const selectedRow = event.getParameter("rowContext");
        if (selectedRow) {
            const metric = selectedRow.getObject() as any;
            const cacheName = this.getView().getElementBinding().getBoundContext().getProperty("name");

            // Navigate to single metric view
            this.getRouter().navTo("singleKeyMetric", {
                cache: cacheName,
                keyMetricId: metric.ID
            });

            // Set layout to three columns
            (<JSONModel>this.getModel("app")).setProperty("/layout", "ThreeColumnsEndExpanded");
        }
    }

    /**
     * Refresh key data
     */
    public async onRefreshKeyMetricsData(): Promise<void> {
        await this.loadKeyMetricsData(true);
    }

    public onRefreshMetricsData(): void {
        this.loadStatistics(true);
    }

    public async onShowKeyMetricsMetadata(event: Button$PressEvent): Promise<void> {
        const context = event.getSource().getBindingContext() as Context;

        const saveJson = (json: string) => {
            try {
                return JSON.stringify(JSON.parse(json), null, 2)
            } catch (error) {
                return json
            }
        }

        const localData = new JSONModel({
            metadata: saveJson(context.getProperty("metadata")),
            subject: saveJson(context.getProperty("subject")),
            query: saveJson(context.getProperty("query")),
            cacheOptions: saveJson(context.getProperty("cacheOptions")),
            keyName: context.getProperty("keyName"),
        });

        const fragment = await Fragment.load({
            definition: `<core:FragmentDefinition xmlns:core="sap.ui.core" xmlns:mvc="sap.ui.core.mvc" xmlns="sap.m" xmlns:form="sap.ui.layout.form">
                <Popover title="{localData>/keyName}" placement="Bottom" contentWidth="30rem">
                    <content>
                        <IconTabBar>
                            <items>
                                <IconTabFilter text="Metadata">
                                    <content>
                                        <TextArea value="{localData>/metadata}" rows="20" width="100%" editable="false" />
                                    </content>
                                </IconTabFilter>
                                <IconTabFilter text="Subject" >
                                    <content>
                                        <TextArea value="{localData>/subject}" rows="20" width="100%" editable="false" />
                                    </content>
                                </IconTabFilter>
                                <IconTabFilter text="Query" >
                                    <content>
                                        <TextArea value="{localData>/query}" rows="20" width="100%" editable="false" />
                                    </content>
                                </IconTabFilter>
                                <IconTabFilter text="Cache Options" >
                                    <content>
                                        <TextArea value="{localData>/cacheOptions}" rows="20" width="100%" editable="false" />
                                    </content>
                                </IconTabFilter>
                                </items>
                        </IconTabBar>
                    </content>
                </Popover>
            </core:FragmentDefinition>`,
            controller: this,
        });

        const popover = fragment as Popover;
        popover.setModel(localData, "localData");
        popover.openBy(event.getSource());
    }

    /**
     * Clear statistics
     */
    public async onClearMetrics(): Promise<void> {
        const cacheContext = this.getView().getElementBinding().getBoundContext() as Context;
        if (!cacheContext) {
            return;
        }

        try {
            const model = this.getModel() as ODataModel;
            const action = model.bindContext(`plugin.cds_caching.CachingApiService.clearMetrics(...)`, cacheContext);
            await action.invoke();

            MessageToast.show("Metrics cleared successfully");

            // Refresh the data
            this.loadStatistics(true);

        } catch (error) {
            console.error("Error clearing metrics:", error);
            MessageBox.error("Failed to clear metrics");
        }
    }

    /**
     * Clear key metrics
     */
    public async onClearKeyMetrics(): Promise<void> {
        const cacheContext = this.getView().getElementBinding().getBoundContext() as Context;
        if (!cacheContext) {
            return;
        }

        try {
            const model = this.getModel() as ODataModel;
            const action = model.bindContext(`plugin.cds_caching.CachingApiService.clearKeyMetrics(...)`, cacheContext);
            await action.invoke();

            MessageToast.show("Key metrics cleared successfully");

        } catch (error) {
            console.error("Error clearing key metrics:", error);
            MessageBox.error("Failed to clear key metrics");
        }
    }

}