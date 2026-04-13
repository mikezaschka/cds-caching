const cds = require("@sap/cds-dk");
const { copy, path, write } = cds.utils;
const { join } = path;

module.exports = class extends cds.add.Plugin {
	async run() {
		const src = join(__dirname, "..", "app", "dashboard");
		await copy(src).to("app", "caching-dashboard", "webapp");

		const cdsFile = join(cds.root, "srv", "caching-api.cds");
		if (!cds.utils.fs.existsSync(cdsFile)) {
			await write(
				"using {plugin.cds_caching.CachingApiService} from 'cds-caching/index.cds';\n",
			).to("srv/caching-api.cds");
		}
	}
};
