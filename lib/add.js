const cds = require("@sap/cds-dk");
const { copy, path, write, fs } = cds.utils;
const { join } = path;

const APP_ID = "cds.plugin.caching.dashboard";
const UI5_VERSION = "1.136.1";

function resolveModuleId() {
	const project = cds.add?.readProject?.();
	if (project?.name) return project.name;
	const pkgPath = join(cds.root, "package.json");
	if (fs.existsSync(pkgPath)) {
		return JSON.parse(fs.readFileSync(pkgPath, "utf8")).name || "app";
	}
	return "app";
}

function builtUi5Yaml() {
	return `specVersion: "4.0"
metadata:
  name: ${APP_ID}
type: application
framework:
  name: SAPUI5
  version: "${UI5_VERSION}"
  libraries:
    - name: sap.m
    - name: sap.f
    - name: sap.ui.core
    - name: sap.ui.layout
    - name: sap.ui.table
    - name: sap.ui.unified
    - name: sap.tnt
    - name: sap.viz
    - name: themelib_sap_horizon
`;
}

function sourceUi5Yaml(moduleId) {
	return `specVersion: "4.0"
metadata:
  name: ${APP_ID}
type: application
framework:
  name: SAPUI5
  version: "${UI5_VERSION}"
  libraries:
    - name: sap.m
    - name: sap.f
    - name: sap.ui.comp
    - name: sap.tnt
    - name: sap.ui.core
    - name: sap.ui.layout
    - name: sap.ui.table
    - name: sap.ui.unified
    - name: sap.ui.ux3
    - name: sap.viz
    - name: themelib_sap_horizon
builder:
  resources:
    excludes:
      - "test/e2e/**"
  customTasks:
    - name: ui5-tooling-transpile-task
      afterTask: replaceVersion
server:
  customMiddleware:
    - name: ui5-tooling-transpile-middleware
      afterMiddleware: compression
    - name: ui5-middleware-cap
      afterMiddleware: compression
      configuration:
        moduleId: ${moduleId}
`;
}

function ui5DeployYaml() {
	return `specVersion: "4.0"
metadata:
  name: ${APP_ID}
type: application
resources:
  configuration:
    propertiesFileSourceEncoding: UTF-8
extends:
  path: ui5.yaml
builder:
  resources:
    excludes:
      - /test/**
      - /localService/**
  customTasks:
    - name: ui5-task-zipper
      afterTask: generateCachebusterInfo
      configuration:
        archiveName: ${APP_ID}
        relativePaths: true
        additionalFiles:
          - xs-app.json
`;
}

const DASHBOARD_SCRIPTS = {
	start: "ui5 serve -o index.html",
	build: "ui5 build --clean-dest --dest dist",
	"build:cf": "ui5 build --clean-dest --config ui5-deploy.yaml --include-task=generateCachebusterInfo",
};

const DASHBOARD_UI5_DEPS = {
	"@sap/ux-ui5-tooling": "^1",
	"@ui5/cli": "^4",
	"ui5-task-zipper": "^3",
};

function xsAppJson() {
	return `${JSON.stringify({
		welcomeFile: "/index.html",
		authenticationMethod: "route",
		routes: [
			{
				source: "^/odata/v4/caching-api/(.*)$",
				target: "/odata/v4/caching-api/$1",
				destination: "srv-api",
				authenticationType: "xsuaa",
				csrfProtection: true,
			},
			{
				source: "^(.*)$",
				target: "$1",
				service: "html5-apps-repo-rt",
				authenticationType: "xsuaa",
			},
		],
	}, null, 2)}\n`;
}

function builtPackageJson() {
	return `${JSON.stringify({
		name: APP_ID,
		version: "1.0.0",
		description: "cds-caching dashboard",
		private: true,
		scripts: DASHBOARD_SCRIPTS,
		devDependencies: DASHBOARD_UI5_DEPS,
	}, null, 2)}\n`;
}

function sourcePackageJson() {
	return `${JSON.stringify({
		name: APP_ID,
		version: "1.0.0",
		description: "cds-caching dashboard",
		private: true,
		scripts: DASHBOARD_SCRIPTS,
		devDependencies: {
			...DASHBOARD_UI5_DEPS,
			"@openui5/types": `^${UI5_VERSION}`,
			"typescript": "^5.8.3",
			"ui5-middleware-cap": "^3.3.0",
			"ui5-tooling-transpile": "^3.5.0",
		},
	}, null, 2)}\n`;
}

function tsconfigJson() {
	return `${JSON.stringify({
		compilerOptions: {
			target: "es2023",
			module: "es2022",
			moduleResolution: "node",
			skipLibCheck: true,
			allowJs: true,
			strict: true,
			strictNullChecks: false,
			strictPropertyInitialization: false,
			rootDir: "./webapp",
			types: ["@openui5/types"],
			paths: {
				"cds/plugin/caching/dashboard/*": ["./webapp/*"],
			},
		},
		include: ["./webapp/**/*"],
	}, null, 2)}\n`;
}

function getScaffoldFiles(source, moduleId) {
	const files = {
		"app/caching-dashboard/ui5.yaml": source ? sourceUi5Yaml(moduleId) : builtUi5Yaml(),
		"app/caching-dashboard/ui5-deploy.yaml": ui5DeployYaml(),
		"app/caching-dashboard/xs-app.json": xsAppJson(),
		"app/caching-dashboard/package.json": source ? sourcePackageJson() : builtPackageJson(),
	};
	if (source) {
		files["app/caching-dashboard/tsconfig.json"] = tsconfigJson();
	}
	return files;
}

class AddCachingDashboard extends cds.add.Plugin {
	options() {
		return {
			source: {
				type: "boolean",
				default: false,
				help: "Copy TypeScript source instead of the pre-built dashboard (for customization).",
			},
		};
	}

	async run() {
		const source = !!cds.cli?.options?.source;
		const src = join(__dirname, "..", "app", source ? "dashboard-src" : "dashboard");
		await copy(src).to("app", "caching-dashboard", "webapp");

		const files = getScaffoldFiles(source, resolveModuleId());
		for (const [target, content] of Object.entries(files)) {
			if (!fs.existsSync(join(cds.root, target))) {
				await write(content).to(target);
			}
		}

		const cdsFile = join(cds.root, "srv", "caching-api.cds");
		if (!fs.existsSync(cdsFile)) {
			await write(
				"using {plugin.cds_caching.CachingApiService} from 'cds-caching/index.cds';\n",
			).to("srv/caching-api.cds");
		}
	}
}

AddCachingDashboard.getScaffoldFiles = getScaffoldFiles;
AddCachingDashboard.resolveModuleId = resolveModuleId;

module.exports = AddCachingDashboard;
