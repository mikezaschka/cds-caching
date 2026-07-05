'use strict';

function getCdsMajor() {
    return Number.parseInt(require('@sap/cds/package.json').version.split('.')[0], 10);
}

const cdsMajor = getCdsMajor();

async function resetTestData(test) {
    if (cdsMajor >= 9) {
        await test.data.reset();
    }
}

function describeFromCds(minMajor, title, fn) {
    (cdsMajor >= minMajor ? describe : describe.skip)(title, fn);
}

module.exports = {
    cdsMajor,
    getCdsMajor,
    resetTestData,
    describeFromCds,
};
