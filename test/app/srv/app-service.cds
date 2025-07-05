using {Northwind} from './external/Northwind.csn';
using {plugin.cds_caching.CachingApiService} from 'cds-caching/index.cds';

service AppService {
    entity Foo {
        key ID   : Integer;
            name : String;
            bar  : Association to Bar
                       on bar.foo = $self;
            products : Association to Northwind.Products;
    } actions {
        @cache: {
            service: 'caching',
            ttl    : 0
        }
        function getBoundCachedValue(param1 : String) returns String;
    };


    entity Bar {
        key ID   : Integer;
            name : String;
            foo  : Association to Foo;
    };


    entity ManualCachedFoo as projection on Foo;

    @cache                 : {
        service: 'caching',
        ttl    : 5000,
        key    : {template: '{hash}_{user}'},
        tags   : [
            {template: 'user-{user}'},
            {value: 'user-1'},
            {
                data  : 'name',
                prefix: 'name-'
            }
        ]
    }
    @cds.redirection.target: Bar
    entity CachedFoo       as projection on Foo;

    @cache: {
        service: 'caching-northwind',
        ttl    : 5000
    }
    @readonly
    entity Products        as projection on Northwind.Products;

    @cache: {
        service: 'caching',
        tags   : ['getCachedValue'],
        ttl    : 0
    }
    function getCachedValue(param1 : String)    returns String;


    function manualCachedValue(param1 : String) returns String;

}
