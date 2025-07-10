using {Northwind} from './external/Northwind.csn';
using {plugin.cds_caching.CachingApiService} from 'cds-caching/index.cds';

service AppService {
    entity Foo {
        key ID   : Integer;
            name : String;
            bar  : Association to Bar
                       on bar.foo = $self;
            products : Association to Northwind.Products;
    }

    entity Bar {
        key ID   : Integer;
            name : String;
            foo  : Association to Foo;
    };

    @cache                 : {
        service: 'caching',
        ttl    : 5000,
        key    : '{hash}_{user}',
        tags   : [
            {template: 'user-{user}'},
            {
                data  : 'name',
                prefix: 'foo-'
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
}
