#!/bin/sh
set -eu

major="${CDS_MAJOR:?CDS_MAJOR is required}"
sqlite_major=$([ "$major" = "9" ] && echo 2 || echo 3)

echo "Installing dependencies for @sap/cds ^${major} (@cap-js/sqlite ^${sqlite_major})..."

npm pkg set \
    "devDependencies.@sap/cds=^${major}" \
    "devDependencies.@sap/cds-dk=^${major}"

npm pkg set \
    "dependencies.@sap/cds=^${major}" \
    "devDependencies.@cap-js/sqlite=^${sqlite_major}" \
    -w cds-caching-test

npm pkg set \
    "dependencies.@sap/cds=^${major}" \
    "devDependencies.@cap-js/sqlite=^${sqlite_major}" \
    -w cds-caching-example-app

node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.overrides = {
    '@sap/cds': '^${major}',
    '@sap/cds-dk': '^${major}',
    '@cap-js/sqlite': '^${sqlite_major}',
};
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

npm install --legacy-peer-deps

node -e "
const version = require('@sap/cds/package.json').version;
const major = Number.parseInt(version.split('.')[0], 10);
if (major !== Number('${major}')) {
    console.error('Expected @sap/cds@${major}, got @sap/cds@' + version);
    process.exit(1);
}
console.log('Using @sap/cds@' + version);
"
