'use strict';

// Seed via physical tables — avoids CDS 8 resolve.transitions failures on
// service-level CSV INSERT during cds.deploy() to :memory:.
module.exports = async (tx) => {
    await tx.run(`INSERT INTO AppService_Foo (ID, name, products_ID) VALUES
        (1, 'Foo1', 1),
        (2, 'Foo2', 2)`);
    await tx.run(`INSERT INTO AppService_Owned (ID, name, owner) VALUES
        (1, 'Admin row', 'cacheadmin'),
        (2, 'Plain row', 'plainuser')`);
    await tx.run(`INSERT INTO AppService_Bar (ID, name, foo_ID) VALUES
        (1, 'Bar1', 1),
        (2, 'Bar2', 2),
        (3, 'Bar3', 1),
        (4, 'Bar4', 2)`);
};
