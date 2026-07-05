import MessageBox from "sap/m/MessageBox";
import BaseController from "./BaseController";
import JSONModel from "sap/ui/model/json/JSONModel";
import { Route$PatternMatchedEvent } from "sap/ui/core/routing/Route";
import Table, { Table$RowSelectionChangeEvent } from "sap/ui/table/Table";
import MessageToast from "sap/m/MessageToast";
import Context from "sap/ui/model/odata/v4/Context";
import ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import { Button$PressEvent } from "sap/m/Button";
import { Switch$ChangeEvent } from "sap/m/Switch";
import Fragment from "sap/ui/core/Fragment";
import Popover from "sap/m/Popover";

/**
 * @namespace cds.plugin.caching.dashboard.controller
 */
export default class Cache extends BaseController {
    private uiModel: JSONModel;

    public onInit(): void {
        super.onInit();

        this.uiModel = new JSONModel({
            selectedTab: "main",
            statistics: [],
            loading: false,
            loadingEntries: false,
            showEntriesTable: false,
            cacheEntries: [],

            createKey: "",
            createValue: "",
            createTtl: 3600,

            getKey: "",
            getValue: "",

            deleteKey: "",

            metricsEnabled: false,
            keyMetricsEnabled: false,
        });
        this.getView().setModel(this.uiModel, "ui");

        this.getRouter().getRoute("cache").attachPatternMatched(this.onRouteMatched, this);
    }

    public onRouteMatched(event: Route$PatternMatchedEvent): void {
        const { cache } = event.getParameter("arguments") as { cache: string };
        this.getAppModel().setProperty("/selectedCache", cache);
        this.getAppModel().setProperty("/layout", "TwoColumnsMidExpanded");

        this.getView().bindElement({
            path: `/Caches('${cache.replace(/'/g, "''")}')`,
            events: {
                change: () => {
                    const context = this.getView().getElementBinding()?.getBoundContext();
                    if (context) {
                        this.uiModel.setProperty("/config", context.getProperty("configuration"));
                        this.loadStatistics();
                        this.loadKeyMetricsData();
                    }
                }
            }
        });
    }

    private loadStatistics(refresh = false): void {
        const table = this.getView().byId("metricsTable") as Table;
        const binding = table.getBinding("rows") as ODataListBinding;
        if (binding.isSuspended()) {
            binding.resume();
        }
        if (refresh) {
            binding.refresh();
        }
    }

    private loadKeyMetricsData(refresh = false): void {
        const table = this.getView().byId("keyMetricsTable") as Table;
        const binding = table.getBinding("rows") as ODataListBinding;
        if (binding.isSuspended()) {
            binding.resume();
        }
        if (refresh) {
            binding.refresh();
        }
    }

    public async onLoadCacheEntries(): Promise<void> {
        const cacheContext = this.getView().getElementBinding().getBoundContext() as Context;

        try {
            this.uiModel.setProperty("/loadingEntries", true);
            this.uiModel.setProperty("/showEntriesTable", true);
            this.uiModel.setSizeLimit(100_000);

            const model = this.getODataModel();
            const context = model.bindContext(`plugin.cds_caching.CachingApiService.getEntries(...)`, cacheContext);
            await context.invoke();
            const { value: entries } = await context.requestObject() as { value: Array<{ tags: string[] | string; entryKey: string; value: string; timestamp: string }> };
            for (const entry of entries) {
                if (Array.isArray(entry.tags)) {
                    entry.tags = entry.tags.join(", ");
                }
            }

            this.uiModel.setProperty("/cacheEntries", entries);

        } catch (error) {
            console.error("Error loading cache entries:", error);
            MessageBox.error(await this.i18nText("msgLoadEntriesFailed"));
        } finally {
            this.uiModel.setProperty("/loadingEntries", false);
        }
    }

    public onMetricsRowSelect(event: Table$RowSelectionChangeEvent): void {
        const selectedRow = event.getParameter("rowContext");
        if (selectedRow) {
            const metric = selectedRow.getObject() as { ID: string };
            const cacheName = this.getView().getElementBinding().getBoundContext().getProperty("name");

            this.getRouter().navTo("singleMetric", {
                cache: cacheName,
                metricId: metric.ID
            });

            this.getAppModel().setProperty("/layout", "ThreeColumnsEndExpanded");
        }
    }

    public async onSetKey(): Promise<void> {
        const cacheContext = this.getView().getElementBinding().getBoundContext() as Context;
        const key = this.uiModel.getProperty("/createKey");
        const value = this.uiModel.getProperty("/createValue");
        const ttl = this.uiModel.getProperty("/createTtl");

        if (!key || !value) {
            MessageBox.error(await this.i18nText("msgProvideKeyValue"));
            return;
        }

        try {
            const model = this.getODataModel();
            const context = model.bindContext(`plugin.cds_caching.CachingApiService.setEntry(...)`, cacheContext);
            context.setParameter("key", key);
            context.setParameter("value", value);
            context.setParameter("ttl", ttl);
            await context.invoke();

            MessageToast.show(await this.i18nText("msgEntryCreated"));

            this.uiModel.setProperty("/createKey", "");
            this.uiModel.setProperty("/createValue", "");
            this.uiModel.setProperty("/createTtl", 3600);

        } catch (error) {
            console.error("Error setting cache entry:", error);
            MessageBox.error(await this.i18nText("msgCreateEntryFailed"));
        }
    }

    public async onGetKey(): Promise<void> {
        const cacheContext = this.getView().getElementBinding().getBoundContext() as Context;
        const key = this.uiModel.getProperty("/getKey");

        if (!key) {
            MessageBox.error(await this.i18nText("msgProvideKey"));
            return;
        }

        try {
            const model = this.getODataModel();
            const action = model.bindContext(`plugin.cds_caching.CachingApiService.getEntry(...)`, cacheContext);
            action.setParameter("key", key);
            await action.invoke();

            const result = await action.requestObject() as { value?: string };
            this.uiModel.setProperty("/getValue", result.value || (await this.i18nText("msgNotFound")));

        } catch (error) {
            console.error("Error getting cache entry:", error);
            this.uiModel.setProperty("/getValue", await this.i18nText("msgGetEntryError"));
        }
    }

    public async onDeleteKey(): Promise<void> {
        const cacheContext = this.getView().getElementBinding().getBoundContext() as Context;
        const key = this.uiModel.getProperty("/deleteKey");

        if (!key) {
            MessageBox.error(await this.i18nText("msgProvideKey"));
            return;
        }

        try {
            const model = this.getODataModel();
            const context = model.bindContext(`plugin.cds_caching.CachingApiService.deleteEntry(...)`, cacheContext);
            context.setParameter("key", key);
            await context.invoke();

            MessageToast.show(await this.i18nText("msgEntryDeleted"));
            this.uiModel.setProperty("/deleteKey", "");

        } catch (error) {
            console.error("Error deleting cache entry:", error);
            MessageBox.error(await this.i18nText("msgDeleteEntryFailed"));
        }
    }

    public async onEnableMetricsChange(event: Switch$ChangeEvent): Promise<void> {
        const enabled = event.getParameter("state");
        const cacheContext = this.getView().getElementBinding().getBoundContext() as Context;

        try {
            const model = this.getODataModel();
            const context = model.bindContext(`plugin.cds_caching.CachingApiService.setMetricsEnabled(...)`, cacheContext);
            context.setParameter("enabled", enabled);
            await context.invoke();

            MessageToast.show(await this.i18nText(enabled ? "msgMetricsEnabled" : "msgMetricsDisabled"));
        } catch (error) {
            console.error("Error setting metrics enabled:", error);
            MessageBox.error(await this.i18nText("msgFailedUpdateMetrics"));
            this.uiModel.setProperty("/metricsEnabled", !enabled);
        }
    }

    public async onEnableKeyMetricsChange(event: Switch$ChangeEvent): Promise<void> {
        const enabled = event.getParameter("state");
        const cacheContext = this.getView().getElementBinding().getBoundContext() as Context;

        try {
            const model = this.getODataModel();
            const context = model.bindContext(`plugin.cds_caching.CachingApiService.setKeyMetricsEnabled(...)`, cacheContext);
            context.setParameter("enabled", enabled);
            await context.invoke();

            MessageToast.show(await this.i18nText(enabled ? "msgKeyMetricsEnabled" : "msgKeyMetricsDisabled"));

        } catch (error) {
            console.error("Error setting key metrics enabled:", error);
            MessageBox.error(await this.i18nText("msgFailedKeyMetrics"));
            this.uiModel.setProperty("/keyMetricsEnabled", !enabled);
        }
    }

    public async onClearCache(): Promise<void> {
        const cacheContext = this.getView().getElementBinding().getBoundContext() as Context;

        const confirmMsg = await this.i18nText("msgConfirmClearCache");
        MessageBox.confirm(confirmMsg, {
            actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
            emphasizedAction: MessageBox.Action.OK,
            onClose: async (action: string) => {
                if (action === MessageBox.Action.OK) {
                    try {
                        const model = this.getODataModel();
                        const context = model.bindContext(`plugin.cds_caching.CachingApiService.clear(...)`, cacheContext);
                        await context.invoke();

                        MessageBox.success(await this.i18nText("msgCacheCleared"));
                        await this.onRefresh();

                    } catch (error) {
                        console.error("Error clearing cache:", error);
                        MessageBox.error(await this.i18nText("msgClearCacheFailed"));
                    }
                }
            }
        });
    }

    public async onRefresh(): Promise<void> {
        if (this.getView().getElementBinding()?.getBoundContext()) {
            this.loadStatistics(true);
            this.loadKeyMetricsData(true);
        }
    }

    public handleClose(): void {
        this.getRouter().navTo("main");
    }

    public handleFullScreen(): void {
        this.getAppModel().setProperty("/layout", "MidColumnFullScreen");
    }

    public handleExitFullScreen(): void {
        this.getAppModel().setProperty("/layout", "TwoColumnsMidExpanded");
    }

    public onKeyMetricsRowSelect(event: Table$RowSelectionChangeEvent): void {
        const selectedRow = event.getParameter("rowContext");
        if (selectedRow) {
            const metric = selectedRow.getObject() as { ID: string; keyName: string };
            const cacheName = this.getView().getElementBinding().getBoundContext().getProperty("name");

            this.getRouter().navTo("singleKeyMetric", {
                cache: cacheName,
                keyMetricId: metric.ID,
                keyName: encodeURIComponent(metric.keyName)
            });

            this.getAppModel().setProperty("/layout", "ThreeColumnsEndExpanded");
        }
    }

    public async onRefreshKeyMetricsData(): Promise<void> {
        this.loadKeyMetricsData(true);
    }

    public async onRefreshMetricsData(): Promise<void> {
        this.loadStatistics(true);
    }

    public async onShowKeyMetricsMetadata(event: Button$PressEvent): Promise<void> {
        const context = event.getSource().getBindingContext() as Context;

        const formatJson = (json: string) => {
            try {
                return JSON.stringify(JSON.parse(json), null, 2);
            } catch {
                return json;
            }
        };

        const localData = new JSONModel({
            metadata: formatJson(context.getProperty("metadata")),
            subject: formatJson(context.getProperty("subject")),
            query: formatJson(context.getProperty("query")),
            cacheOptions: formatJson(context.getProperty("cacheOptions")),
            keyName: context.getProperty("keyName"),
        });

        const fragment = await Fragment.load({
            name: "cds.plugin.caching.dashboard.view.KeyMetricsMetadata",
            controller: this,
        });

        const popover = fragment as Popover;
        popover.setModel(localData, "localData");
        popover.openBy(event.getSource());
    }

    public async onClearMetrics(): Promise<void> {
        const cacheContext = this.getView().getElementBinding().getBoundContext() as Context;
        if (!cacheContext) {
            return;
        }

        try {
            const model = this.getODataModel();
            const action = model.bindContext(`plugin.cds_caching.CachingApiService.clearMetrics(...)`, cacheContext);
            await action.invoke();

            MessageToast.show(await this.i18nText("msgMetricsCleared"));
            await this.onRefreshMetricsData();

        } catch (error) {
            console.error("Error clearing metrics:", error);
            MessageBox.error(await this.i18nText("msgFailedClearMetrics"));
        }
    }

    public async onClearKeyMetrics(): Promise<void> {
        const cacheContext = this.getView().getElementBinding().getBoundContext() as Context;
        if (!cacheContext) {
            return;
        }

        try {
            const model = this.getODataModel();
            const action = model.bindContext(`plugin.cds_caching.CachingApiService.clearKeyMetrics(...)`, cacheContext);
            await action.invoke();

            MessageToast.show(await this.i18nText("msgKeyMetricsCleared"));
            await this.onRefreshKeyMetricsData();

        } catch (error) {
            console.error("Error clearing key metrics:", error);
            MessageBox.error(await this.i18nText("msgFailedClearKeyMetrics"));
        }
    }

}
