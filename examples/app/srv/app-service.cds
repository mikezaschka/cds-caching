using {db} from '../db/model';
using {API_BUSINESS_PARTNER} from './external/API_BUSINESS_PARTNER.csn';
using { plugin.cds_caching.Statistics } from 'cds-caching/index.cds';

service AppService {

    entity Foo              as projection on db.Foo
        actions {
            @cache: {
                service: 'caching',
                ttl    : 0
            }
            function getBoundCachedValue(param1 : String) returns String;
        };

    entity ManualCachedFoo  as projection on db.Foo;

    @cache: {
        service: 'caching',
        ttl    : 5000,
        key    : { template: '{hash}_{user}' },
        tags: [ { template: 'user-{user}' }, { value: 'user-1' }, { data: 'name', prefix: 'name-' } ]
    }
    entity CachedFoo        as projection on db.Foo;

    @cache: {
        service: 'caching-bp',
        ttl    : 0
    }
    @readonly
    entity BusinessPartners as projection on API_BUSINESS_PARTNER.A_BusinessPartner;

    @cache: {
        service: 'caching',
        ttl    : 0
    }
    function getCachedValue(param1 : String)    returns String;


    function manualCachedValue(param1 : String) returns String;

}
