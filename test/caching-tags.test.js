const { expect } = require('chai');
const CachingService = require('../srv/CachingService');

describe('CachingService Tag Resolution', () => {
    let cachingService;

    beforeEach(() => {
        cachingService = new CachingService();
    });

    describe('Static Tags', () => {
        it('should resolve static tag values', () => {
            const tags = [{ value: 'static-tag' }];
            const result = cachingService.resolveTags(tags);
            expect(result).to.deep.equal(['static-tag']);
        });

        it('should handle multiple static tags', () => {
            const tags = [
                { value: 'tag1' },
                { value: 'tag2' }
            ];
            const result = cachingService.resolveTags(tags);
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
            const result = cachingService.resolveTags(tags, testData);
            expect(result).to.deep.equal(['12345']);
        });

        it('should handle data with prefix and suffix', () => {
            const tags = [{
                data: 'BusinessPartner',
                prefix: 'bp-',
                suffix: '-tag'
            }];
            const result = cachingService.resolveTags(tags, testData);
            expect(result).to.deep.equal(['bp-12345-tag']);
        });

        it('should resolve multiple datas with separator', () => {
            const tags = [{
                data: ['BusinessPartner', 'Name'],
                separator: '|'
            }];
            const result = cachingService.resolveTags(tags, testData);
            expect(result).to.deep.equal(['12345|John Doe']);
        });

        it('should handle array of data objects', () => {
            const arrayData = [
                { BusinessPartner: '12345', Name: 'John' },
                { BusinessPartner: '67890', Name: 'Jane' }
            ];
            const tags = [{ data: 'BusinessPartner' }];
            const result = cachingService.resolveTags(tags, arrayData);
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
            const result = cachingService.resolveTags(tags, null, testParams);
            expect(result).to.deep.equal(['user123']);
        });

        it('should handle parameter with prefix and suffix', () => {
            const tags = [{
                param: 'userId',
                prefix: 'user-',
                suffix: '-tag'
            }];
            const result = cachingService.resolveTags(tags, null, testParams);
            expect(result).to.deep.equal(['user-user123-tag']);
        });

        it('should resolve multiple parameters with separator', () => {
            const tags = [{
                param: ['role', 'department'],
                separator: ':'
            }];
            const result = cachingService.resolveTags(tags, null, testParams);
            expect(result).to.deep.equal(['admin:IT']);
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
            const result = cachingService.resolveTags(tags, testData);
            expect(result).to.deep.equal(['static', '12345']);
        });

        it('should handle combination of all tag types', () => {
            const tags = [
                { value: 'static-tag' },
                { data: 'BusinessPartner', prefix: 'bp-' },
                { param: 'userId', prefix: 'user-' }
            ];
            const result = cachingService.resolveTags(tags, testData, testParams);
            expect(result).to.deep.equal(['static-tag', 'bp-12345', 'user-user123']);
        });

        it('should remove duplicate tags', () => {
            const tags = [
                { value: 'tag1' },
                { value: 'tag1' },
                { data: 'BusinessPartner' },
                { data: 'BusinessPartner' }
            ];
            const result = cachingService.resolveTags(tags, testData);
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
            const result = cachingService.resolveTags(tags, arrayData);
            expect(result).to.deep.equal(['bp-12345', 'bp-67890', 'bp-11111']);
        });

        it('should generate combined data tags for each object', () => {
            const tags = [{
                data: ['BusinessPartner', 'Department'],
                separator: '|',
                prefix: 'employee-'
            }];
            const result = cachingService.resolveTags(tags, arrayData);
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
            const result = cachingService.resolveTags(tags, arrayData);
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
            const result = cachingService.resolveTags(tags, arrayData, params);
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
            const result = cachingService.resolveTags(tags, duplicateData);
            expect(result).to.deep.equal([
                '12345', '67890',
                'role-admin', 'role-user'
            ]);
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty tag configurations', () => {
            const result = cachingService.resolveTags([]);
            expect(result).to.deep.equal([]);
        });

        it('should handle undefined/null data and params', () => {
            const tags = [{ value: 'static' }];
            const result = cachingService.resolveTags(tags, null, null);
            expect(result).to.deep.equal(['static']);
        });

        it('should handle missing datas gracefully', () => {
            const tags = [{ data: 'NonExistentdata' }];
            const data = { BusinessPartner: '12345' };
            const result = cachingService.resolveTags(tags, data);
            expect(result).to.deep.equal([]);
        });

        it('should handle missing parameters gracefully', () => {
            const tags = [{ param: 'nonExistentParam' }];
            const params = { userId: 'user123' };
            const result = cachingService.resolveTags(tags, null, params);
            expect(result).to.deep.equal([]);
        });

        it('should handle malformed tag configurations', () => {
            const tags = [
                {},  // Empty config
                { unknown: 'value' },  // Unknown property
                { data: 'BusinessPartner' }  // Valid config
            ];
            const data = { BusinessPartner: '12345' };
            const result = cachingService.resolveTags(tags, data);
            expect(result).to.deep.equal(['12345']);
        });

        it("should handle string data", () => {
                const tags = [{ value: 'static' }, { data: 'not-available-data' }];
            const result = cachingService.resolveTags(tags, 'test');
            expect(result).to.deep.equal(['static']);
        });
    });
}); 