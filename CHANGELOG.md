# Changelog

## [2.0.1](https://github.com/mikezaschka/cds-caching/compare/2.0.0...2.0.1) (2026-07-10)

## [2.0.0](https://github.com/mikezaschka/cds-caching/compare/1.3.2...2.0.0) (2026-07-05)

### Features

* add config normalizer for metrics v2 and legacy compatibility ([ec77573](https://github.com/mikezaschka/cds-caching/commit/ec7757317ab2551f3c9e9e4da8e684d939608df5))
* add plugin roots resolver for metrics reuse activation ([593d517](https://github.com/mikezaschka/cds-caching/commit/593d517fd9dc5de3ec2613472bb9c26a0b5b9b8b))
* **dashboard:** add key metric detail view and table filters ([020cbf0](https://github.com/mikezaschka/cds-caching/commit/020cbf04477b4f21904fa25c3805bae9d85d556b))
* expand cds add caching-dashboard with --source scaffold ([52b96f0](https://github.com/mikezaschka/cds-caching/commit/52b96f0c6d7164272b92a832e8d251e7192a3fb3))
* serve bundled dashboard when dashboard: true ([1ad7fae](https://github.com/mikezaschka/cds-caching/commit/1ad7fae9e814115c04ab05999c07f6388689a571))
* update cds add scaffold for HTML5 repo zip deploy ([e62f773](https://github.com/mikezaschka/cds-caching/commit/e62f7739c2c0be04485f81e394532f59acf5c3a5))

### Bug Fixes

* hash CQN when URL has no query string ([54ecf48](https://github.com/mikezaschka/cds-caching/commit/54ecf4808ddb915a250080fe4ec3f291a4d62e06))
* normalize dashboard i18n unicode escapes ([7253ae0](https://github.com/mikezaschka/cds-caching/commit/7253ae0b94aea3e080b0728c941c5fc6cd2b4f42))
* serve dashboard static files with express.static ([6cf99ab](https://github.com/mikezaschka/cds-caching/commit/6cf99abae40b3d43b2f91464e91e4835ab35623c))
* treat HCQL POST SELECT as cacheable read ([9ff1f90](https://github.com/mikezaschka/cds-caching/commit/9ff1f90617ee60c069200c54be165407cf3a6f65))

## [1.3.2](https://github.com/mikezaschka/cds-caching/compare/1.3.1...1.3.2) (2026-04-24)

### Features

* enhance caching plugin with runtime model integration ([ce0666d](https://github.com/mikezaschka/cds-caching/commit/ce0666dd4ec1eea6c01768ed9d3cbca80053f9d5))
* implement automatic cache invalidation on write ([6f5f9d4](https://github.com/mikezaschka/cds-caching/commit/6f5f9d4588c0941b20393897bf21768efa855b0e))
* integrate i18n support in dashboard ([c480648](https://github.com/mikezaschka/cds-caching/commit/c4806489903e7350cc0120dbbdc4b9454f1b3962))
* refactor caching plugin for improved HANA build integration ([dacc012](https://github.com/mikezaschka/cds-caching/commit/dacc012cd48934e204a3543ab2a8192ec42d3272))

### Bug Fixes

* add main export for caching service in cds-plugin ([c1cf253](https://github.com/mikezaschka/cds-caching/commit/c1cf2530ea6579668adf913d8217106f813c25b2))

## [1.3.1](https://github.com/mikezaschka/cds-caching/compare/1.3.0...1.3.1) (2026-04-15)

### Features

* enhance cache clear functionality and update documentation ([7e92948](https://github.com/mikezaschka/cds-caching/commit/7e92948c93f1ba6ba53e42963d73c4bc7298eff0))
* enhance KeyManager to include HTTP URL in cache key generation ([1b1ed6b](https://github.com/mikezaschka/cds-caching/commit/1b1ed6b6eae5b31af8414769fbc71f7e52bc9c0d))

## [1.3.0](https://github.com/mikezaschka/cds-caching/compare/1.2.1...1.3.0) (2026-04-13)

### Features

* add caching dashboard integration and update documentation ([982d86f](https://github.com/mikezaschka/cds-caching/commit/982d86ffadb90d0d0793bb445e0fb27a4fff242e))
* enhance caching plugin and update dependencies ([994aa21](https://github.com/mikezaschka/cds-caching/commit/994aa21eb4da152ab972cafbe515811d21d85776))
* enhance caching plugin with auto-loading of entity models and improved statistics handling ([ac77959](https://github.com/mikezaschka/cds-caching/commit/ac779598fa515b3337711c7be6d9de5c309c0fda))
* enhance dashboard formatter and update resource links ([f015e7c](https://github.com/mikezaschka/cds-caching/commit/f015e7c312adde363867e727b3eadbf9cacd53f2))
* include hana and postgres support ([096e9c7](https://github.com/mikezaschka/cds-caching/commit/096e9c7cb52ebb77f9d8f863345c93eb8d14eacb))
* integrate OpenTelemetry for enhanced caching metrics ([4c20f60](https://github.com/mikezaschka/cds-caching/commit/4c20f6085902e1ab74c1cbd5e726a054d79defc7))
* update caching plugin for multi-tenancy support and enhance documentation ([a15d74b](https://github.com/mikezaschka/cds-caching/commit/a15d74b7b2da98c9e5a0883125d441eb03c5950e))

### Bug Fixes

* apply all PR review feedback for telemetry integration ([91b49cd](https://github.com/mikezaschka/cds-caching/commit/91b49cd500d7a81f9ed79e76872014571bdc3d0a))
* apply PR review feedback - remove credential leak, fix hasTask, per-tenant init, docs updates ([f817865](https://github.com/mikezaschka/cds-caching/commit/f8178654bcd854f2f7e171cf0585761b41cb66f3))
* only create hdbtable for hana based caching ([c8abec1](https://github.com/mikezaschka/cds-caching/commit/c8abec17878666725eafb04bac6349eff9b7d8c5))
* remove redundant logging and add table build logging in caching plugin ([7e560ec](https://github.com/mikezaschka/cds-caching/commit/7e560ecd05a95b1bee5a6fdfb17709aab32ba0b9))

## [1.2.1](https://github.com/mikezaschka/cds-caching/compare/1.2.0...1.2.1) (2026-02-09)

## [1.2.0](https://github.com/mikezaschka/cds-caching/compare/1.1.0...1.2.0) (2026-02-09)

### Bug Fixes

* changed db.entities to cds.entities - for future use ([562d5c4](https://github.com/mikezaschka/cds-caching/commit/562d5c4d61ad4a0fa78774f1b4d1a7cdc27e9683))
* remove console.log statement fixes [#14](https://github.com/mikezaschka/cds-caching/issues/14) ([cdd6893](https://github.com/mikezaschka/cds-caching/commit/cdd68938774952b6f22d4141c07305bb99f8ff00))

## [1.1.0](https://github.com/mikezaschka/cds-caching/compare/1.0.0...1.1.0) (2025-07-29)
