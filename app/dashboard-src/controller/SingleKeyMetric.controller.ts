import BaseController from "./BaseController";
import JSONModel from "sap/ui/model/json/JSONModel";
import { Route$PatternMatchedEvent } from "sap/ui/core/routing/Route";
import MessageBox from "sap/m/MessageBox";

interface KeyMetricData {
    keyName?: string;
    operation?: string;
    dataType?: string;
    operationType?: string;
    target?: string;
    tenant?: string;
    user?: string;
    locale?: string;
    hits?: number;
    misses?: number;
    totalRequests?: number;
    hitRatio?: number;
    cacheEfficiency?: number;
    avgHitLatency?: number;
    avgMissLatency?: number;
    nativeHits?: number;
    nativeMisses?: number;
    nativeSets?: number;
    nativeDeletes?: number;
    metadata?: string;
    subject?: string;
    query?: string;
    cacheOptions?: string;
    lastAccess?: string;
    timestamp?: string;
}

/**
 * @namespace cds.plugin.caching.dashboard.controller
 */
export default class SingleKeyMetric extends BaseController {
    private uiModel: JSONModel;

    public onInit(): void {
        super.onInit();

        this.uiModel = new JSONModel({
            keyMetricId: "",
            keyName: "",
            operation: "",
            dataType: "",
            operationType: "",
            target: "",
            tenant: "",
            user: "",
            locale: "",
            hits: 0,
            misses: 0,
            totalRequests: 0,
            hitRatio: 0,
            cacheEfficiency: 0,
            avgHitLatency: 0,
            avgMissLatency: 0,
            nativeHits: 0,
            nativeMisses: 0,
            nativeSets: 0,
            nativeDeletes: 0,
            metadata: "",
            subject: "",
            query: "",
            cacheOptions: "",
            lastAccess: "",
            timestamp: "",
        });
        this.getView().setModel(this.uiModel, "ui");

        this.getRouter().getRoute("singleKeyMetric").attachPatternMatched(this.onRouteMatched, this);
    }

    public onRouteMatched(event: Route$PatternMatchedEvent): void {
        const { cache, keyMetricId, keyName } = event.getParameter("arguments") as {
            cache: string;
            keyMetricId: string;
            keyName: string;
        };

        this.uiModel.setProperty("/keyMetricId", keyMetricId);
        this.getAppModel().setProperty("/layout", "ThreeColumnsEndExpanded");

        this.loadKeyMetric(cache, keyMetricId, decodeURIComponent(keyName));
    }

    private escapeODataString(value: string): string {
        return value.replace(/'/g, "''");
    }

    private formatJson(value: string): string {
        if (!value) {
            return "";
        }
        try {
            return JSON.stringify(JSON.parse(value), null, 2);
        } catch {
            return value;
        }
    }

    private async loadKeyMetric(cacheName: string, keyMetricId: string, keyName: string): Promise<void> {
        try {
            const model = this.getODataModel();
            const context = model.bindContext(
                `/KeyMetrics(ID='${this.escapeODataString(keyMetricId)}',cache='${this.escapeODataString(cacheName)}',keyName='${this.escapeODataString(keyName)}')`
            );
            const metric = await context.requestObject() as KeyMetricData;

            if (metric) {
                this.uiModel.setProperty("/keyName", metric.keyName || keyName);
                this.uiModel.setProperty("/operation", metric.operation || "");
                this.uiModel.setProperty("/dataType", metric.dataType || "");
                this.uiModel.setProperty("/operationType", metric.operationType || "");
                this.uiModel.setProperty("/target", metric.target || "");
                this.uiModel.setProperty("/tenant", metric.tenant || "");
                this.uiModel.setProperty("/user", metric.user || "");
                this.uiModel.setProperty("/locale", metric.locale || "");
                this.uiModel.setProperty("/hits", metric.hits || 0);
                this.uiModel.setProperty("/misses", metric.misses || 0);
                this.uiModel.setProperty("/totalRequests", metric.totalRequests || 0);
                this.uiModel.setProperty("/hitRatio", metric.hitRatio || 0);
                this.uiModel.setProperty("/cacheEfficiency", metric.cacheEfficiency || 0);
                this.uiModel.setProperty("/avgHitLatency", metric.avgHitLatency || 0);
                this.uiModel.setProperty("/avgMissLatency", metric.avgMissLatency || 0);
                this.uiModel.setProperty("/nativeHits", metric.nativeHits || 0);
                this.uiModel.setProperty("/nativeMisses", metric.nativeMisses || 0);
                this.uiModel.setProperty("/nativeSets", metric.nativeSets || 0);
                this.uiModel.setProperty("/nativeDeletes", metric.nativeDeletes || 0);
                this.uiModel.setProperty("/metadata", this.formatJson(metric.metadata || ""));
                this.uiModel.setProperty("/subject", this.formatJson(metric.subject || ""));
                this.uiModel.setProperty("/query", this.formatJson(metric.query || ""));
                this.uiModel.setProperty("/cacheOptions", this.formatJson(metric.cacheOptions || ""));
                this.uiModel.setProperty("/lastAccess", metric.lastAccess || "");
                this.uiModel.setProperty("/timestamp", metric.timestamp || "");
            } else {
                MessageBox.error(await this.i18nText("msgMetricNotFound"));
            }
        } catch (error) {
            console.error("Error loading key metric:", error);
            MessageBox.error(await this.i18nText("msgLoadMetricFailed"));
        }
    }

    public onRefresh(): void {
        const cacheName = this.getAppModel().getProperty("/selectedCache");
        const keyMetricId = this.uiModel.getProperty("/keyMetricId");
        const keyName = this.uiModel.getProperty("/keyName");

        if (cacheName && keyMetricId && keyName) {
            this.loadKeyMetric(cacheName, keyMetricId, keyName);
        }
    }

    public handleFullScreen(): void {
        this.getAppModel().setProperty("/layout", "EndColumnFullScreen");
    }

    public handleExitFullScreen(): void {
        this.getAppModel().setProperty("/layout", "ThreeColumnsEndExpanded");
    }

    public handleClose(): void {
        this.getAppModel().setProperty("/layout", "TwoColumnsMidExpanded");
        this.getRouter().navTo("cache", { cache: this.getAppModel().getProperty("/selectedCache") });
    }
}
