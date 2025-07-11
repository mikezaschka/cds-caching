const TagResolver = require('../lib/support/TagResolver');
const { expect } = require('chai');

describe('TagResolver', () => {

    let tagResolver;

    // berfore connect to the cache service
    beforeEach(async () => {
        tagResolver = new TagResolver();
    })

    describe('Static Tags', () => {
        it('should resolve static tag values', () => {
            const tags = [{ value: 'static-tag' }];
            const result = tagResolver.resolveTags(tags);
            expect(result).to.deep.equal(['static-tag']);
        });

        it('should handle multiple static tags', () => {
            const tags = [
                { value: 'tag1' },
                { value: 'tag2' }
            ];
            const result = tagResolver.resolveTags(tags);
            expect(result).to.deep.equal(['tag1', 'tag2']);
        });
    });

    describe('data-based Tags', () => {
        const testData = {
            BusinessPartner: '12345',
            Name: 'John Doe'
        };

        it('should resolve single data tag', () => {
            const tags = [{ data: 'BusinessPartner' }];
            const result = tagResolver.resolveTags(tags, testData);
            expect(result).to.deep.equal(['12345']);
        });

        it('should handle data with prefix and suffix', () => {
            const tags = [{
                data: 'BusinessPartner',
                prefix: 'bp-',
                suffix: '-tag'
            }];
            const result = tagResolver.resolveTags(tags, testData);
            expect(result).to.deep.equal(['bp-12345-tag']);
        });

        it('should resolve multiple datas with separator', () => {
            const tags = [{
                data: ['BusinessPartner', 'Name'],
                separator: '|'
            }];
            const result = tagResolver.resolveTags(tags, testData);
            expect(result).to.deep.equal(['12345|John Doe']);
        });

        it('should handle array of data objects', () => {
            const arrayData = [
                { BusinessPartner: '12345', Name: 'John' },
                { BusinessPartner: '67890', Name: 'Jane' }
            ];
            const tags = [{ data: 'BusinessPartner' }];
            const result = tagResolver.resolveTags(tags, arrayData);
            expect(result).to.deep.equal(['12345', '67890']);
        });
    });

    describe('Parameter-based Tags', () => {
        const testParams = {
            userId: 'user123',
            role: 'admin',
            department: 'IT'
        };

        it('should resolve single parameter tag', () => {
            const tags = [{ param: 'userId' }];
            const result = tagResolver.resolveTags(tags, null, testParams);
            expect(result).to.deep.equal(['user123']);
        });

        it('should handle parameter with prefix and suffix', () => {
            const tags = [{
                param: 'userId',
                prefix: 'user-',
                suffix: '-tag'
            }];
            const result = tagResolver.resolveTags(tags, null, testParams);
            expect(result).to.deep.equal(['user-user123-tag']);
        });

        it('should resolve multiple parameters with separator', () => {
            const tags = [{
                param: ['role', 'department'],
                separator: ':'
            }];
            const result = tagResolver.resolveTags(tags, null, testParams);
            expect(result).to.deep.equal(['admin:IT']);
        });
    });

    describe('Template-based Tags', () => {
        const testParams = {
            tenant: 'tenant123',
            user: 'user456',
            locale: 'en-US'
        };

        it('should resolve template tag with single placeholder', () => {
            const tags = [{ template: 'tenant-{tenant}' }];
            const result = tagResolver.resolveTags(tags, null, testParams);
            expect(result).to.deep.equal(['tenant-tenant123']);
        });

        it('should resolve template tag with multiple placeholders', () => {
            const tags = [{ template: '{tenant}-{user}-{locale}' }];
            const result = tagResolver.resolveTags(tags, null, testParams);
            expect(result).to.deep.equal(['tenant123-user456-en-US']);
        });

        it('should handle template with hash placeholder', () => {
            const data = { id: 123, name: 'Test' };
            const tags = [{ template: 'data-{hash}' }];
            const result = tagResolver.resolveTags(tags, data);
            // We can't predict the exact hash, but we can check the format
            expect(result[0]).to.match(/^data-[0-9a-f]{32}$/);
        });

        it('should handle template with prefix and suffix', () => {
            const tags = [{
                template: '{tenant}-{user}',
                prefix: 'tag-',
                suffix: '-v1'
            }];
            const result = tagResolver.resolveTags(tags, null, testParams);
            expect(result).to.deep.equal(['tag-tenant123-user456-v1']);
        });

        it('should use default values for missing placeholders', () => {
            const tags = [{ template: '{tenant}-{user}-{locale}' }];
            const result = tagResolver.resolveTags(tags, null, {});
            expect(result).to.deep.equal(['global-anonymous-en']);
        });
    });

    describe('Combined Scenarios', () => {
        const testData = { BusinessPartner: '12345', Name: 'John' };
        const testParams = { userId: 'user123', role: 'admin' };

        it('should handle combination of static and data tags', () => {
            const tags = [
                { value: 'static' },
                { data: 'BusinessPartner' }
            ];
            const result = tagResolver.resolveTags(tags, testData);
            expect(result).to.deep.equal(['static', '12345']);
        });

        it('should handle combination of all tag types', () => {
            const tags = [
                { value: 'static-tag' },
                { data: 'BusinessPartner', prefix: 'bp-' },
                { param: 'userId', prefix: 'user-' }
            ];
            const result = tagResolver.resolveTags(tags, testData, testParams);
            expect(result).to.deep.equal(['static-tag', 'bp-12345', 'user-user123']);
        });

        it('should remove duplicate tags', () => {
            const tags = [
                { value: 'tag1' },
                { value: 'tag1' },
                { data: 'BusinessPartner' },
                { data: 'BusinessPartner' }
            ];
            const result = tagResolver.resolveTags(tags, testData);
            expect(result).to.deep.equal(['tag1', '12345']);
        });
    });

    describe('Array Data Scenarios', () => {
        const arrayData = [
            {
                BusinessPartner: '12345',
                Name: 'John Doe',
                Department: 'Sales',
                Roles: ['admin', 'user']
            },
            {
                BusinessPartner: '67890',
                Name: 'Jane Smith',
                Department: 'IT',
                Roles: ['developer']
            },
            {
                BusinessPartner: '11111',
                Name: 'Bob Wilson',
                Department: 'HR',
                Roles: ['manager', 'admin']
            }
        ];

        it('should generate tags for each object in array with single data', () => {
            const tags = [{
                data: 'BusinessPartner',
                prefix: 'bp-'
            }];
            const result = tagResolver.resolveTags(tags, arrayData);
            expect(result).to.deep.equal(['bp-12345', 'bp-67890', 'bp-11111']);
        });

        it('should generate combined data tags for each object', () => {
            const tags = [{
                data: ['BusinessPartner', 'Department'],
                separator: '|',
                prefix: 'employee-'
            }];
            const result = tagResolver.resolveTags(tags, arrayData);
            expect(result).to.deep.equal([
                'employee-12345|Sales',
                'employee-67890|IT',
                'employee-11111|HR'
            ]);
        });

        it('should handle multiple tag configurations with array data', () => {
            const tags = [
                { value: 'static-tag' },
                { data: 'BusinessPartner', prefix: 'bp-' },
                { data: ['Name', 'Department'], separator: ':', prefix: 'emp-' }
            ];
            const result = tagResolver.resolveTags(tags, arrayData);
            expect(result).to.deep.equal([
                'static-tag',
                'bp-12345', 'bp-67890', 'bp-11111',
                'emp-John Doe:Sales', 'emp-Jane Smith:IT', 'emp-Bob Wilson:HR'
            ]);
        });

        it('should handle mixed static and array-based tags with params', () => {
            const params = { tenant: 'tenant1' };
            const tags = [
                { value: 'global-tag' },
                { param: 'tenant', prefix: 'tenant-' },
                { data: ['BusinessPartner', 'Department'], separator: '|' }
            ];
            const result = tagResolver.resolveTags(tags, arrayData, params);
            expect(result).to.deep.equal([
                'global-tag',
                'tenant-tenant1',
                '12345|Sales',
                '67890|IT',
                '11111|HR'
            ]);
        });

        it('should deduplicate tags from array data', () => {
            const duplicateData = [
                { BusinessPartner: '12345', Role: 'admin' },
                { BusinessPartner: '12345', Role: 'admin' }, // Duplicate
                { BusinessPartner: '67890', Role: 'user' }
            ];

            const tags = [
                { data: 'BusinessPartner' },
                { data: 'Role', prefix: 'role-' }
            ];
            const result = tagResolver.resolveTags(tags, duplicateData);
            expect(result).to.deep.equal([
                '12345', '67890',
                'role-admin', 'role-user'
            ]);
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty tag configurations', () => {
            const result = tagResolver.resolveTags([]);
            expect(result).to.deep.equal([]);
        });

        it('should handle undefined/null data and params', () => {
            const tags = [{ value: 'static' }];
            const result = tagResolver.resolveTags(tags, null, null);
            expect(result).to.deep.equal(['static']);
        });

        it('should handle missing datas gracefully', () => {
            const tags = [{ data: 'NonExistentdata' }];
            const data = { BusinessPartner: '12345' };
            const result = tagResolver.resolveTags(tags, data);
            expect(result).to.deep.equal([]);
        });

        it('should handle missing parameters gracefully', () => {
            const tags = [{ param: 'nonExistentParam' }];
            const params = { userId: 'user123' };
            const result = tagResolver.resolveTags(tags, null, params);
            expect(result).to.deep.equal([]);
        });

        it('should handle malformed tag configurations', () => {
            const tags = [
                {},  // Empty config
                { unknown: 'value' },  // Unknown property
                { data: 'BusinessPartner' }  // Valid config
            ];
            const data = { BusinessPartner: '12345' };
            const result = tagResolver.resolveTags(tags, data);
            expect(result).to.deep.equal(['12345']);
        });

        it("should handle string data", () => {
            const tags = [{ value: 'static' }, { data: 'not-available-data' }];
            const result = tagResolver.resolveTags(tags, 'test');
            expect(result).to.deep.equal(['static']);
        });
    });
});
