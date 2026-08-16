const { expect } = require('chai');
const { canonicalizeQuery, canonicalizeValue, MAX_DEPTH } = require('../lib/support/queryCanonicalizer');

describe('queryCanonicalizer', () => {

    describe('prototype-chain clauses', () => {

        function withPrototypeClause(clause, value) {
            const select = Object.create({ [clause]: value });
            select.from = { ref: ['Foo'] };
            return { SELECT: select };
        }

        it('captures a where clause that lives on the prototype', () => {
            const query = withPrototypeClause('where', [{ ref: ['ID'] }, '=', { val: 1 }]);

            expect(JSON.stringify(query.SELECT)).to.not.include('where');
            expect(canonicalizeQuery(query).SELECT.where).to.deep.equal([{ ref: ['ID'] }, '=', { val: 1 }]);
        });

        it('captures every clause that changes the result set', () => {
            for (const clause of ['where', 'columns', 'orderBy', 'groupBy', 'having', 'limit']) {
                const query = withPrototypeClause(clause, [{ ref: ['x'] }]);
                expect(canonicalizeQuery(query).SELECT, clause).to.have.property(clause);
            }
        });
    });

    describe('determinism', () => {

        it('orders object keys, so insertion order does not change the result', () => {
            const a = { SELECT: { from: { ref: ['Foo'] }, where: [{ val: 1 }], columns: [{ ref: ['a'] }] } };
            const b = { SELECT: { columns: [{ ref: ['a'] }], where: [{ val: 1 }], from: { ref: ['Foo'] } } };

            expect(JSON.stringify(canonicalizeQuery(a))).to.equal(JSON.stringify(canonicalizeQuery(b)));
        });

        it('orders nested object keys too', () => {
            const a = canonicalizeValue({ b: 1, a: { d: 2, c: 3 } }, new WeakSet(), 0);
            expect(JSON.stringify(a)).to.equal('{"a":{"c":3,"d":2},"b":1}');
        });

        it('preserves array order, which is semantic', () => {
            const asc = { SELECT: { from: { ref: ['Foo'] }, orderBy: [{ ref: ['a'] }, { ref: ['b'] }] } };
            const desc = { SELECT: { from: { ref: ['Foo'] }, orderBy: [{ ref: ['b'] }, { ref: ['a'] }] } };

            expect(JSON.stringify(canonicalizeQuery(asc))).to.not.equal(JSON.stringify(canonicalizeQuery(desc)));
        });
    });

    describe('runtime bookkeeping is excluded', () => {

        it('drops the cacheKey this plugin attaches', () => {
            const query = { SELECT: { from: { ref: ['Foo'] }, where: [{ val: 1, cacheKey: 'x' }] } };
            expect(JSON.stringify(canonicalizeQuery(query))).to.not.include('cacheKey');
        });

        it('drops internal properties, so their churn cannot change keys', () => {
            const clean = { SELECT: { from: { ref: ['Foo'] } } };
            const noisy = { SELECT: { from: { ref: ['Foo'] }, _target: { huge: true }, $refLinks: [1, 2] } };

            expect(JSON.stringify(canonicalizeQuery(clean)))
                .to.equal(JSON.stringify(canonicalizeQuery(noisy)));
        });

        it('reduces a linked CSN definition to its name', () => {
            const entity = { name: 'AppService.Foo', kind: 'entity', elements: { ID: {} } };
            const query = { SELECT: { from: entity } };

            expect(canonicalizeQuery(query).SELECT.from).to.deep.equal({ ref: ['AppService.Foo'] });
        });
    });

    describe('hostile input', () => {

        it('survives a cycle inside a clause', () => {
            const where = [{ val: 1 }];
            where.push({ nested: where });
            const query = { SELECT: { from: { ref: ['Foo'] }, where } };

            expect(() => canonicalizeQuery(query)).to.not.throw();
            expect(JSON.stringify(canonicalizeQuery(query))).to.include('circular');
        });

        it('ignores properties outside the known clauses entirely', () => {
            const select = { from: { ref: ['Foo'] } };
            select.somethingElse = select; // never walked, so cannot recurse

            expect(() => canonicalizeQuery({ SELECT: select })).to.not.throw();
            expect(JSON.stringify(canonicalizeQuery({ SELECT: select })))
                .to.equal('{"SELECT":{"from":{"ref":["Foo"]}}}');
        });

        it('stops at the depth limit', () => {
            let nested = { leaf: true };
            for (let i = 0; i < MAX_DEPTH + 5; i++) nested = { nested };

            expect(() => canonicalizeQuery({ SELECT: { from: nested } })).to.not.throw();
        });

        it('drops functions rather than failing on them', () => {
            const query = { SELECT: { from: { ref: ['Foo'] }, where: [{ val: 1, fn: () => 1 }] } };
            expect(JSON.stringify(canonicalizeQuery(query))).to.not.include('fn');
        });

        it('serializes dates and buffers stably', () => {
            const when = new Date('2026-01-01T00:00:00.000Z');
            const query = { SELECT: { from: { ref: ['Foo'] }, where: [{ val: when }] } };

            expect(JSON.stringify(canonicalizeQuery(query))).to.include('2026-01-01T00:00:00.000Z');
            expect(canonicalizeValue(Buffer.from('hi'), new WeakSet(), 0)).to.equal('aGk=');
        });
    });

    describe('non-SELECT queries', () => {

        it('reports INSERT, UPDATE and DELETE as not cacheable', () => {
            for (const query of [{ INSERT: {} }, { UPDATE: {} }, { DELETE: {} }]) {
                expect(canonicalizeQuery(query)).to.be.undefined;
            }
        });

        it('reports non-objects as not cacheable', () => {
            for (const query of [null, undefined, 'SELECT 1', 42]) {
                expect(canonicalizeQuery(query)).to.be.undefined;
            }
        });
    });

    describe('subqueries', () => {

        it('canonicalizes a SELECT nested in from', () => {
            const inner = Object.create({ where: [{ ref: ['owner'] }, '=', { val: 'alice' }] });
            inner.from = { ref: ['Foo'] };
            const query = { SELECT: { from: { SELECT: inner } } };

            expect(canonicalizeQuery(query).SELECT.from.SELECT.where)
                .to.deep.equal([{ ref: ['owner'] }, '=', { val: 'alice' }]);
        });
    });
});
