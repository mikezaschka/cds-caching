/* SAP CVOM 4.0 © <2012-2014> SAP SE. All rights reserved. Build Version 1.9.1, Build context N/A */
sap.ui.define(["sap/ui/thirdparty/jquery"], (jQuery) => {
(function (global) {
    // cache global require & define
    sap.viz.moduleloader.originalDefine = global.define;
    sap.viz.moduleloader.originalRequire = global.require;
    sap.viz.moduleloader.originalRequirejs = global.requirejs;

    // replace with sap.viz.moduleloader.require/define
    global.define = sap.viz.moduleloader.define;
    global.require = sap.viz.moduleloader.require.config({
        context: "lw-vizservices",
        exportMap: {
            'sap/viz/vizservices/service/bvr/BVRService' : 'sap.viz.vizservices.BVRService',
            'sap/viz/vizservices/service/feed/FeedService' : 'sap.viz.vizservices.FeedService',
            'sap/viz/vizservices/service/binding/BindingService' : 'sap.viz.vizservices.__internal__.BindingService',
            'sap/viz/vizservices/service/property/PropertyService' : 'sap.viz.vizservices.__internal__.PropertyService',
            'sap/viz/vizservices/service/scale/ScaleService' : 'sap.viz.vizservices.__internal__.ScaleService',
            'sap/viz/vizservices/common/Version' : 'sap.viz.vizservices.VERSION'
        }
    });
    global.requirejs = require;
})(this);

define('sap/viz/vizservices/common/feed/FeedConst',[],function() {
    var FeedConst = {};
    
    FeedConst.ID_TRELLIS_ROW = 'trellisRow';
    FeedConst.ID_TRELLIS_COLUMN = 'trellisColumn';
    FeedConst.ID_DATAFRAME = 'dataFrame';
    FeedConst.ID_TIME_AXIS = 'timeAxis';
    
    // ID on AnalysisObject
    FeedConst.ID_MND = 'MND';

    // Types on AnalysisObject
    FeedConst.TYPE_DIMENSION = 'Dimension';
    FeedConst.TYPE_MEASURE = 'Measure';
    FeedConst.TYPE_MND = 'MND';

    // DataTypes on AnalysisObject
    FeedConst.DATA_TYPE_STRING = 'String';
    FeedConst.DATA_TYPE_NUMBER = 'Number';
    FeedConst.DATA_TYPE_DATE = 'Date';
    
    return FeedConst;
});

define('sap/viz/vizservices/common/utils/OOUtil',[],function() {

    var OOUtil = {};

    /**
     * Extend class, superClz's constructor will be applied with no parameters.
     *
     * @para {function} subClz the sub class
     * @para {function} superClz the super class to be extended
     * @return {function} the extended subClz
     * @public
     * @static
     */
    OOUtil.extend = function(subClz, superClz) {
        var subClzPrototype = subClz.prototype;

        // add the superclass prototype to the subclass definition
        subClz.superclass = superClz.prototype;

        // copy prototype
        var F = function() {
        };
        F.prototype = superClz.prototype;

        subClz.prototype = new F();
        for(var prop in subClzPrototype) {
            if(subClzPrototype.hasOwnProperty(prop)) {
                subClz.prototype[prop] = subClzPrototype[prop];
            }
        }
        subClz.prototype.constructor = subClz;
        if(superClz.prototype.constructor == Object.prototype.constructor) {
            superClz.prototype.constructor = superClz;
        }
        return subClz;
    };
    return OOUtil;
});

define('sap/viz/vizservices/common/data/DatasetTypeConst',[], function() {
    /**
     * Dataset Types.
     */
    var DatasetTypeConst = {};    

    DatasetTypeConst.FLAT_TABLE ='FlatTableDataset';
 
    DatasetTypeConst.CROSS_TABLE ='CrossTableDataset';

    DatasetTypeConst.RAW ='RawDataset';
    
    DatasetTypeConst.ARRAY_FLAT_TABLE = 'ArrayOfFlatTableDataset';

    return DatasetTypeConst;
});

define('sap/viz/vizservices/common/metadata/MetadataBase',[
    'sap/viz/vizservices/common/data/DatasetTypeConst'
// @formatter:off
], function(DatasetTypeConst){
// @formatter:on
    /**
     * MetadataBase Class
     */
    var MetadataBase = function(raw) {
        this._raw = raw;
        this._support = {dataset : {}};
        this._support.dataset[DatasetTypeConst.CROSS_TABLE] = false;
        this._support.dataset[DatasetTypeConst.FLAT_TABLE] = false;
        this._bindingDefs = null;
    };

    MetadataBase.prototype.raw = function() {
        return this._raw;
    };

    MetadataBase.prototype.support = function() {
        return this._support;
    };

    MetadataBase.prototype.removeInvalidProperty = function(srcProperties) {
        var allProperties = this.getRawPropertiesDef();
        var type = this._raw.type;
        //Add internal properties
        this._removeInvalidProperty(srcProperties, allProperties);
    };
     
     MetadataBase.prototype.dataType = function() {
        if(!this._raw ){
            return null;
        }
        if(this._raw.dataType === "sap.viz.api.data.CrosstableDataset"){
            return DatasetTypeConst.CROSS_TABLE;
        } else if (this._raw.dataType === "sap.viz.api.data.FlatTableDataset") {
            return DatasetTypeConst.FLAT_TABLE;
        } else if(this._raw.dataType === "raw") {
            return DatasetTypeConst.RAW;
        } else {
            return null;
        }
    };

    return MetadataBase;
});

define('sap/viz/vizservices/common/metadata/bindingdef/BindingDefConst',[],function() {
    var BindingDefConst = {};

    BindingDefConst.TYPE_DIMENSION = 'Dimension';
    BindingDefConst.TYPE_MEASURE = 'Measure';

    BindingDefConst.MND_MODE_NONE = 'none';
    BindingDefConst.MND_MODE_SUPPORT_EXCLUSIVELY = 'supportExclusively',
    BindingDefConst.MND_MODE_SUPPORT = 'support';

    BindingDefConst.MND_MODE_ONLY = 'mndOnly';
    
    return BindingDefConst;
});

define('sap/viz/vizservices/common/metadata/bindingdef/BindingDef',[
    'sap/viz/vizservices/common/metadata/bindingdef/BindingDefConst'
    ],
    function(
        BindingDefConst
        ) {
    /**
     * BindingDef Class
     *
     * @param {Object} settings
     *  id {String}
     *  name {String}
     *  type {String} Bindable analysis object type
     *      Enumeration: Dimension, Measure, universal
     *  min {int} Min number of binding analysis objects
     *  max {int} Max number of binding analysis objects
     *  mndEnumerable {Boolean} A flag indicate the measure def whether could enumerate as mnd
     *  mndMode {String} A flag indicate the dimension def whether accept the mnd
     *      Enumeration:
     *      none: Not support MND
     *      support: Support MND and dimensions
     *      supportExclusively: Support MND and MND will confict with other dimensions
     *  bvrMNDPriority {int} The smaller the higher priority when auto feeding
     *  bvrPriority {int} The smaller the higher priority when auto feeding
     */
    var BindingDef = function(settings) {
        this._id = settings.id;
        this._name = settings.name;

        this._type = settings.type;

        this._min = settings.min || 0;
        this._max = settings.max || Infinity;

        this._mndEnumerable = settings.mndEnumerable !== undefined ? settings.mndEnumerable : false;
        this._mndMode = settings.mndMode || BindingDefConst.MND_MODE_NONE;

        this._bvrPriority = settings.bvrPriority !== undefined ? settings.bvrPriority : Number.POSITIVE_INFINITY;
        this._bvrMNDPriority = settings.bvrMNDPriority !== undefined ? settings.bvrMNDPriority : Number.POSITIVE_INFINITY;
    };

    BindingDef.prototype.id = function() {
        return this._id;
    };

    BindingDef.prototype.name = function() {
        return this._name;
    };

    BindingDef.prototype.type = function() {
        return this._type;
    };

    BindingDef.prototype.min = function() {
        return this._min;
    };

    BindingDef.prototype.max = function() {
        return this._max;
    };

    BindingDef.prototype.mndEnumerable = function() {
        return this._mndEnumerable;
    };

    BindingDef.prototype.mndMode = function() {
        return this._mndMode;
    };

    BindingDef.prototype.bvrPriority = function() {
        return this._bvrPriority;
    };

    BindingDef.prototype.bvrMNDPriority = function() {
        return this._bvrMNDPriority;
    };

    BindingDef.prototype.equal = function(def) {
        var equal = true;
        equal = equal && this._id === def.id();
        equal = equal && this._name === def.name();
        equal = equal && this._type === def.type();
        equal = equal && this._min === def.min();
        equal = equal && this._max === def.max();
        equal = equal && this._mndMode === def.mndMode();
        equal = equal && this._bvrPriority === def.bvrPriority();
        equal = equal && this._bvrMNDPriority === def.bvrMNDPriority();
        return equal;
    };

    return BindingDef;
});

define('sap/viz/vizservices/common/metadata/bindingdef/InfoBindingDefAdaptor',[
// @formatter:off
    'sap/viz/vizservices/common/feed/FeedConst',
    'sap/viz/vizservices/common/metadata/bindingdef/BindingDef',
    'sap/viz/vizservices/common/metadata/bindingdef/BindingDefConst'
], function(FeedConst, BindingDef, BindingDefConst){
// @formatter:on
    var _rolesSorting = ['layout', 'mark', 'trellis', 'frame'];
    var _rolesSortingMND = ['mark', 'layout', 'trellis', 'frame'];

    return {
        'adapt' : function(infoDefs, type) {
            var sortedDefs = infoDefs.slice(0).sort(function(infoDef1, infoDef2) {
                if (infoDef1.role === 'trellis.rowCategory' && infoDef2.role === 'trellis.columnCategory') {
                    return -1;
                } else if (infoDef1.role === 'trellis.columnCategory' && infoDef2.role === 'trellis.rowCategory') {
                    return 1;
                } else {
                    return _rolesSorting.indexOf(infoDef1.role.split('.')[0]) - _rolesSorting.indexOf(infoDef2.role.split('.')[0]);
                }
            });
            var defs = [];
            infoDefs.forEach(function(infoDef) {
                var def = {};
                def.id = infoDef.id;
                def.name = infoDef.name;
                def.type = infoDef.type;
                def.min = infoDef.min;
                def.max = infoDef.max;
                def.mndEnumerable = (infoDef.type === BindingDefConst.TYPE_MEASURE && infoDef.role.split('.')[0] === 'layout');
                if (infoDef.acceptMND) {
                    if (infoDef.MNDOnly) {
                        def.mndMode = BindingDefConst.MND_MODE_ONLY;
                    } else {
                        def.mndMode = BindingDefConst.MND_MODE_SUPPORT;
                    }
                } else {
                    def.mndMode = BindingDefConst.MND_MODE_NONE;
                }
                def.bvrPriority = sortedDefs.indexOf(infoDef);
                def.bvrMNDPriority = _rolesSortingMND.indexOf(infoDef.role.split('.')[0]) * 1000 + sortedDefs.indexOf(infoDef);

                defs.push(new BindingDef(def));
            });
            return defs;
        }
    };
});


define('sap/viz/vizservices/common/metadata/InfoMetadata',[
// @formatter:off
    'sap/viz/vizservices/common/utils/OOUtil',
    'sap/viz/vizservices/common/metadata/MetadataBase',
    'sap/viz/vizservices/common/metadata/bindingdef/InfoBindingDefAdaptor',
    'sap/viz/vizservices/common/data/DatasetTypeConst',
    'require'
], function(
    OOUtil, 
    MetadataBase, 
    InfoBindingDefAdaptor, 
    DatasetTypeConst
) {
// @formatter:on
    /**
     * InfoMetadata Class
     */
    var InfoMetadata = function(settings) {
        InfoMetadata.superclass.constructor.apply(this, arguments);
        this._support.dataset[DatasetTypeConst.FLAT_TABLE] = true;
    };
    OOUtil.extend(InfoMetadata, MetadataBase);

    InfoMetadata.prototype.getBindingDefs = function() {
        if (!this._bindingDefs) {
            this._bindingDefs = InfoBindingDefAdaptor.adapt(this._raw.bindings, this._raw.type);
        }
        return this._bindingDefs;
    };
    InfoMetadata.prototype.getBindingDefsWithBVRSorting = function() {
        if (!this._bindingDefsWithBVRSorting) {
            this._bindingDefsWithBVRSorting = this.getBindingDefs().slice(0).sort(function(def1, def2){
                return def1.bvrPriority() - def2.bvrPriority();
            });
        }
        return this._bindingDefsWithBVRSorting;
    };

    // TODO
    InfoMetadata.prototype.getRawPropertiesDef = function() {
        return this._raw.properties;
    };

    InfoMetadata.prototype.getPropertiesDef = function() {
        if (!this._propertiesDef) {
            
            this._propertiesDef = InfoMetadata._adaptInfoPropertiesDef(this._raw.properties);
        }
        return this._propertiesDef;
    };
    InfoMetadata._adaptInfoPropertiesDef = function (rawProperties) {
        var retProp = {};
        for (var propKey in rawProperties) {
            if (rawProperties.hasOwnProperty(propKey)) {
                var propValue = rawProperties[propKey];
                if (propValue.hasOwnProperty('children')) {
                    retProp[propKey] = InfoMetadata._adaptInfoPropertiesDef(propValue.children);
                } else {
                    retProp[propKey] = null;
                }
            }
        }
        return retProp;
    };
    
    
    InfoMetadata.prototype.isBuiltIn = function() {
        return this._raw.isBuiltIn;
    };


    InfoMetadata.prototype.getName = function() {
        return this._raw.name || this._raw.type;
    };

    InfoMetadata.prototype._removeInvalidProperty = function(srcProperties, defaultProperties) {
        if (!defaultProperties) {
            return;
        }

        var propertyName;
        for (propertyName in srcProperties) {
            if (!defaultProperties.hasOwnProperty(propertyName)) {
                delete srcProperties[propertyName];
            } else if (!defaultProperties[propertyName].supportedValueType) {
                var children = defaultProperties[propertyName].children;
                if (children) {
                    this._removeInvalidProperty(srcProperties[propertyName], children);
                }
            }
        }
    };

    InfoMetadata.prototype.dataScale = function() {
        return this._raw.scales;
    };
    
    InfoMetadata.prototype.dataType = function() {
        var dataType = InfoMetadata.superclass.dataType.apply(this);
        if(dataType){
            return dataType;
        } else {
            return DatasetTypeConst.FLAT_TABLE;
        }
    };
    

    return InfoMetadata;
});

define('sap/viz/vizservices/common/metadata/bindingdef/VizFeedingDefAdaptor',[
// @formatter:off
    'sap/viz/vizservices/common/feed/FeedConst',
    'sap/viz/vizservices/common/metadata/bindingdef/BindingDef',
    'sap/viz/vizservices/common/metadata/bindingdef/BindingDefConst'
], function(
    FeedConst, 
    BindingDef,
    BindingDefConst
) {
// @formatter:on
    var VizFeedingDefAdaptor = {};

    VizFeedingDefAdaptor.adapt = function(feedingDefs) {
        var defs = [];
        feedingDefs.forEach(function(feedingDef, index, array) {
            if (feedingDef.id === 'multiplier') {
                defs = defs.concat(_adaptTrellis(feedingDef));
            } else if (feedingDef.type === BindingDefConst.TYPE_DIMENSION) {
                defs.push(_adaptDimension(feedingDef));
            } else if (feedingDef.type === BindingDefConst.TYPE_MEASURE) {
                defs.push(_adaptMeasure(feedingDef));
            }
        });
        return defs;
    };

    var _adaptMeasure = function(feedingDef) {
        return new BindingDef({
            'id' : feedingDef.id,
            'name' : feedingDef.name,
            'type' : BindingDefConst.TYPE_MEASURE,
            'min' : feedingDef.min,
            'max' : feedingDef.max,
            'mndEnumerable': true,
            'mndMode' : BindingDefConst.MND_MODE_NONE,
            'bvrPriority' : feedingDef.mgIndex,
            'bvrMNDPriority' : undefined
        });
    };

    var _adaptDimension = function(feedingDef) {
        var min = feedingDef.minStackedDims !== undefined ? feedingDef.minStackedDims : feedingDef.min;
        var max = feedingDef.maxStackedDims !== undefined ? feedingDef.maxStackedDims : Number.POSITIVE_INFINITY;
        var mnd = _adaptMND(feedingDef);
        return new BindingDef({
            'id' : feedingDef.id,
            'name' : feedingDef.name,
            'type' : BindingDefConst.TYPE_DIMENSION,
            'min' : min,
            'max' : max,
            'mndMode' : mnd.mode,
            'bvrPriority' : feedingDef.aaIndex,
            'bvrMNDPriority' : mnd.priority
        });
    };

    var _adaptTrellis = function(feedingDef) {
        var mnd = _adaptMND(feedingDef);
        return [new BindingDef({
            'id' : FeedConst.ID_TRELLIS_ROW,
            'name' : feedingDef.name,
            'type' : BindingDefConst.TYPE_DIMENSION,
            'min' : 0,
            'max' : 3,
            'mndMode' : mnd.mode,
            'bvrPriority' : Number.POSITIVE_INFINITY,
            'bvrMNDPriority' : mnd.priority
        }), new BindingDef({
            'id' : FeedConst.ID_TRELLIS_COLUMN,
            'name' : feedingDef.name,
            'type' : BindingDefConst.TYPE_DIMENSION,
            'min' : 0,
            'max' : 3,
            'mndMode' : mnd.mode,
            'bvrPriority' : Number.POSITIVE_INFINITY,
            'bvrMNDPriority' : mnd.priority
        })];
    };

    var _adaptMND = function(feedingDef) {
        var mode, priority;
        if (feedingDef.acceptMND !== undefined && feedingDef.acceptMND !== -1 && feedingDef.acceptMND !== false) {
            mode = feedingDef.max === 1 ? BindingDefConst.MND_MODE_SUPPORT_EXCLUSIVELY : BindingDefConst.MND_MODE_SUPPORT;
            priority = feedingDef.acceptMND * -1;
        } else {
            mode = BindingDefConst.MND_MODE_NONE;
            priority = undefined;
        }
        return {
            'mode' : mode,
            'priority' : priority
        };
    };

    return VizFeedingDefAdaptor;
});

define('sap/viz/vizservices/common/metadata/VizMetadata',[
// @formatter:off
    'sap/viz/vizservices/common/utils/OOUtil',
    'sap/viz/vizservices/common/metadata/MetadataBase',
    'sap/viz/vizservices/common/metadata/bindingdef/VizFeedingDefAdaptor',
    'sap/viz/vizservices/common/data/DatasetTypeConst'
], function(OOUtil, 
    MetadataBase, 
    VizFeedingDefAdaptor, 
    DatasetTypeConst
) {
// @formatter:on
    /**
     * VizMetadata Class
     */
    var VizMetadata = function() {
        VizMetadata.superclass.constructor.apply(this, arguments);
        
        this._support.dataset[DatasetTypeConst.CROSS_TABLE] = true;
    };
    OOUtil.extend(VizMetadata, MetadataBase);

    VizMetadata.prototype.getBindingDefs = function() {
        if (!this._bindingDefs) {
            this._bindingDefs = VizFeedingDefAdaptor.adapt(this._raw.allFeeds());
        }
        return this._bindingDefs;
    };
    VizMetadata.prototype.getBindingDefsWithBVRSorting = function() {
        if (!this._bindingDefsWithBVRSorting) {
            this._bindingDefsWithBVRSorting = this.getBindingDefs().slice(0).sort(function(def1, def2){
                return def1.bvrPriority() - def2.bvrPriority();
            });
        }
        return this._bindingDefsWithBVRSorting;
    };

    VizMetadata.prototype.getRawPropertiesDef = function() {
        return this._raw.allProperties();
    };

    VizMetadata.prototype.getPropertiesDef = function () {
        if (!this._propertiesDef) {

            this._propertiesDef = VizMetadata._adaptVizPropertiesDef(this._raw.allProperties())
        }
        return this._propertiesDef;
    };
    VizMetadata._adaptVizPropertiesDef = function (rawProperties) {
        var retProp = {};
        for (var propKey in rawProperties) {
            if (rawProperties.hasOwnProperty(propKey)) {
                var propValue = rawProperties[propKey];
                if (propValue.hasOwnProperty('name')) {
                    retProp[propKey] = null;
                } else {
                    retProp[propKey] = VizMetadata._adaptVizPropertiesDef(propValue);
                }
            }
        }
        return retProp;
    };
            
    VizMetadata.prototype.isBuiltIn = function() {
        return this._raw.isBuiltIn;
    };

    VizMetadata.prototype.getCategoryAxis = function() {
        return this._raw.categoryAxis;
    };

    VizMetadata.prototype.getValueAxis = function() {
        return this._raw.valueAxis;
    };

    VizMetadata.prototype.getName = function() {
        return this._raw.name;
    };

    VizMetadata.prototype._removeInvalidProperty = function(srcProperties, defaultProperties) {
        var propertyName;
        for (propertyName in srcProperties) {
            if (!defaultProperties.hasOwnProperty(propertyName)) {
                delete srcProperties[propertyName];
            } else if (!defaultProperties[propertyName].supportedValueType) {
                this._removeInvalidProperty(srcProperties[propertyName], defaultProperties[propertyName]);
            }
        }
    };

    VizMetadata.prototype.dataScale = function() {
        return this._raw.dataScale;
    };
    
    VizMetadata.prototype.dataType = function() {
        var dataType = VizMetadata.superclass.dataType.apply(this);
        if(dataType){
            return dataType;
        } else {
            return DatasetTypeConst.CROSS_TABLE;
        }
    };

    return VizMetadata;
});

define('sap/viz/vizservices/common/metadata/MetadataFactory',[
// @formatter:off
    'sap/viz/vizservices/common/metadata/InfoMetadata',
    'sap/viz/vizservices/common/metadata/VizMetadata'
], function(InfoMetadata, VizMetadata){
// @formatter:on
    var _cache = {};
    return {
        'get' : function(visualizationType) {
            if (_cache[visualizationType] !== undefined) {
                return _cache[visualizationType];
            }
            var raw, metadata = null;
            try {
                raw = sap.viz.api.metadata.Viz.get(visualizationType);
                if (raw && raw.type) {
                    metadata = new InfoMetadata(raw);
                }
            } catch(err) {
            }
            if (!metadata) {
                try {
                    raw = sap.viz.api.manifest.Viz.get(visualizationType);
                    if (raw && raw[0]) {
                        metadata = new VizMetadata(raw[0]);
                    }
                } catch(err) {
                }
            }
            return (_cache[visualizationType] = metadata);
        }
    };
});

define('sap/viz/vizservices/common/metadata/bindingdef/BindingDefUtils',[
// @formatter:off
    'sap/viz/vizservices/common/metadata/MetadataFactory',
    'sap/viz/vizservices/common/metadata/bindingdef/BindingDefConst',
    'sap/viz/vizservices/common/feed/FeedConst'
], function(
    MetadataFactory,
    BindingDefConst,
    FeedConst
) {
// @formatter:on
    /**
     * BindingDef Class
     */
    var BindingDefUtils = {};

    BindingDefUtils.supportMND = function(visualizationType) {
        var support = false;
        var defs = MetadataFactory.get(visualizationType).getBindingDefs();
        defs.forEach(function(def) {
            support = support || (def.mndMode() !== BindingDefConst.MND_MODE_NONE);
        });
        return support;
    };

    BindingDefUtils.equal = function(visualizationType1, visualizationType2) {
        if (visualizationType1 === visualizationType2) {
            return true;
        }
        var metadata1 = MetadataFactory.get(visualizationType1), metadata2 = MetadataFactory.get(visualizationType2);
        if (metadata1 && metadata2) {
            var defs1 = metadata1.getBindingDefs(), defs2 = metadata2.getBindingDefs();
            if (defs1.length !== defs2.length) {
                return false;
            }
            var equal = true;
            defs1.forEach(function(def1, index, array) {
                equal = equal && def1.equal(defs2[index]);
            });
            return equal;
        } else {
            return false;
        }
    };

    BindingDefUtils.has = function(visualizationType, id) {
        return !!BindingDefUtils.get(visualizationType, id);
    };

    BindingDefUtils.get = function(visualizationType, id) {
        var got;
        var defs = MetadataFactory.get(visualizationType).getBindingDefs();
        defs.forEach(function(def) {
            if (!got && def.id() === id) {
                got = def;
            }
        });
        return got;
    };
    
    BindingDefUtils.support = function(def, analysisObject) {
        if (!analysisObject) {
            return false;
        }
        if (def.type() === BindingDefConst.TYPE_DIMENSION) {
            //the datatype of timeAxis must be Date
            if (def.id() === FeedConst.ID_TIME_AXIS && analysisObject.dataType !== FeedConst.DATA_TYPE_DATE) {
                return false;
            } else {
                if (def.mndMode() === BindingDefConst.MND_MODE_NONE) {
                    return analysisObject.type === FeedConst.TYPE_DIMENSION;
                } else if (def.mndMode() === BindingDefConst.MND_MODE_ONLY) {
                    return analysisObject.type === FeedConst.TYPE_MND;
                } else {
                    return analysisObject.type === FeedConst.TYPE_DIMENSION || analysisObject.type === FeedConst.TYPE_MND;
                }
            }
        } else if (def.type() === BindingDefConst.TYPE_MEASURE) {
            return analysisObject.type === FeedConst.TYPE_MEASURE;
        } else {
            return false;
        }
    };


    return BindingDefUtils;
});

define('sap/viz/vizservices/common/utils/Utils',[],function() {

    var utils = {};

    // static private in global to make sure id is not duplicated
    var _vc_util_GEN_UID = 0;
    var hasOwn = Object.prototype.hasOwnProperty;

    /**
     * return the global uid for HTML elements in the same window scope.
     *
     */
    utils.genUID = function() {
        if (!_vc_util_GEN_UID) {
            _vc_util_GEN_UID = 0;
        }
        return "vcgen_" + (_vc_util_GEN_UID++);
    };
    var class2type = {
        '[object Boolean]' : 'boolean',
        '[object Number]' : 'number',
        '[object String]' : 'string',
        '[object Function]' : 'function',
        '[object Array]' : 'array',
        '[object Date]' : 'date',
        '[object RegExp]' : 'regexp',
        '[object Object]' : 'object'
    };
    
    utils.encodingToken = "_encoded_";
    
    /**
     * apply function when object property is function or else set property value
     *
     */
    utils.applyObjectProperty = function(object, propertyName, propertyValue) {
        try {
            if (utils.isFunction(object[propertyName])) {
                object[propertyName](propertyValue);
            } else {
                object[propertyName] = propertyValue;
            }
        } catch(e) {
            //if (console) {
            //    console.log(e);
            //}
        }

    };
    /**
     * apply properties to a item
     *
     * @name utils.utils.SpreadSheetBindingManager.applyProperties
     * @memberOf Function.prototype
     * @function
     * @param {Object}
     *            the item to apply properties
     * @param {Array}
     *            the properties array
     * */
    utils.applyProperties = function(item, properties/*Array*/) {
        if (properties) {// apply the passed properties
            var len = properties.length;
            for (var i = 0; i < len; i++) {
                var property = properties[i];
                if (property) {
                    utils.applyObjectProperty(item, property.name, property.value);
                }
            }
        }
    };
    /**
     * get object property value
     * @param {object} object
     * @param {String} propertyName
     */
    utils.getObjectProperty = function(object, propertyName) {
        try {
            if (utils.isFunction(object[propertyName])) {
                return object[propertyName]();
            } else if (object.hasOwnProperty(propertyName)) {
                return object[propertyName];
            }

        } catch(e) {
            //if (console) {
            //    console.log(e);
            //}
        }
    };
    /**
     * judge object type
     * @param {object}
     */
    utils.type = function(obj) {
        return obj == null ? String(obj) : class2type[Object.prototype.toString.call(obj)] || "object";
    };
    /**
     * judge object type is or not Object
     * @param {object}
     */
    utils.isObject = function(obj) {
        var type = typeof obj;
        return type === 'function' || type === 'object' && !!obj;
    };
    /**
     * judge object type is or not Function
     * @param {object}
     */
    utils.isFunction = function(obj) {
        return utils.type(obj) === "function";
    };
    /**
     * judge object type is or not Boolean
     * @param {object}
     */
    utils.isBoolean = function(obj) {
        return utils.type(obj) === "boolean";
    };
    /**
     * judge object type is or not String
     * @param {object}
     */
    utils.isString = function(obj) {
        return utils.type(obj) === "string";
    };
    /**
     * judge object type is or not Array
     * @param {object}
     */
    utils.isArray = function(obj) {
        return utils.type(obj) === "array";
    };
    /**
     * judge object type is or not Number
     * @param {object}
     */
    utils.isNumber = function(obj) {
        return utils.type(obj) === "number";
    };
    /**
     * judge object type is or not Object
     * @param {object}
     */
    utils.isObject = function(obj) {
        return utils.type(obj) === "object";
    };

    /**
     * Returns a boolean value indicating whether the parameter is a plain
     * object
     *
     * @param {object}
     * @returns {boolean} Caution: A plain object is an object that has no
     *          prototype method and no parent class. Null, undefined, DOM
     *          nodes and window object are not considered as plain object.
     */
    utils.isPlainObject = function(obj) {
        // Must be an Object.
        // Because of IE, we also have to check the presence of the
        // constructor property.
        // Make sure that DOM nodes and window objects don't pass through,
        // as well
        if (!obj || utils.type(obj) !== "object" || obj.nodeType || (obj && typeof obj === "object" &&
            "setInterval" in obj)) {
            return false;
        }

        // Not own constructor property must be Object
        if (obj.constructor && !hasOwn.call(obj, "constructor") && !hasOwn.call(obj.constructor.prototype,
            "isPrototypeOf")) {
            return false;
        }

        // Own properties are enumerated firstly, so to speed up,
        // if last one is own, then all properties are own.

        var key;
        for (key in obj) {} // jshint ignore:line

        return key === undefined || hasOwn.call(obj, key);
    },

    /**
     * Returns a boolean value indicating whether the parameter is an empty
     * object
     *
     * @param {object}
     * @returns {boolean} Caution: An empty is a plain object without any
     *          properties.
     */
    utils.isEmptyObject = function(obj) {
        for (var name in obj) {
            if (obj.hasOwnProperty(name)) {
                return false;
            }

        }
        return utils.isPlainObject(obj);
    },
    /**
     * judge object type is or not RegExp
     * @param {object}
     */
    utils.isRegExp = function(obj) {
        return utils.type(obj) === "regexp";
    };
    /**
     * Sort an object Array.
     *
     * @param {Array} arr The object Array to sort.
     * @param {String} prop The object field for the sort.
     * @param {Boolean} [desc] Sort by ASC or DESC, by default is ASC.
     *
     */
    utils.sortArrayOn = function(arr, prop, desc) {
        if (utils.isArray(arr) && utils.isString(prop)) {
            arr.sort(function(a, b) {
                return desc ? (a[prop] < b[prop]) - (a[prop] > b[prop]) : (a[prop] > b[prop]) - (a[prop] < b[prop]);
            });
        }
    };
    /**
     * An empty function doing nothing.
     */
    utils.noop = function() {
    };
    /**
     * Delay to call the function
     *
     * @param {Object} handler
     * @param {Object} wait
     */
    utils.delay = function(handler, wait) {
        return setTimeout(function() {
            return handler.apply(null);
        }, wait);
    };
    /**
     * Delay 1ms to call the function
     *
     * @param {Object} handler
     * @param {Object} wait
     */
    utils.defer = function(handler) {
        return utils.delay.call(null, handler, 1);
    };
    /**
     * get event positon
     * @param {Object} event
     */
    utils.getEventPosition = function(event) {
        var pageX = null;
        var pageY = null;
        if (event.originalEvent && event.originalEvent.targetTouches && event.originalEvent.targetTouches.length !== 0) {
            pageX = event.originalEvent.targetTouches[0].pageX;
            pageY = event.originalEvent.targetTouches[0].pageY;
        } else {
            pageX = event.pageX;
            pageY = event.pageY;
        }
        var position = {};
        position.pageX = pageX;
        position.pageY = pageY;
        return position;

    };
    function clone (obj) {
        if (obj === null || typeof (obj) !== 'object') {
            return obj;
        }
        if (typeof (obj) === 'object' && obj.clone && utils.isFunction(obj.clone)) {
            return obj.clone();
        }
        var o = utils.isArray(obj) ? [] : {};
        for (var i in obj) {
            if (obj.hasOwnProperty(i)) {
                o[i] = clone(obj[i]);
            }
        }
        return o;
    }
    /**
     * clone object
     * @param {Object} obj
     */
    utils.clone = clone;

    utils.toJSON = function(instance, processor) {
        if (utils.isArray(instance)) {
            var result = [];
            for (var i = 0; i < instance.length; i++) {
                result.push(processor.call(null, instance[i]));
            }
            return result;
        } else if (instance) {
            return processor.call(null, instance);
        } else {
            return null;
        }
    };
    utils.fromJSON = function(json, processor) {
        if (utils.isArray(json)) {
            var result = [];
            for (var i = 0; i < json.length; i++) {
                result.push(processor.call(null, json[i]));
            }
            return result;
        } else if (json) {
            return processor.call(null, json);
        } else {
            return undefined;
        }
    };
    utils.updateJSON = function(srcJSON, newJSON) {
        // utils.updateJSON is mainly used to handle properties update.
        // It will update all properties from newJSON to srcJSON recursively regardless 
        // the properties is valid or invalid, newJSON will have higher piority
        // In the future, it may also check whether the properties of newJSON is valid 
        // before update
        var retJSON = utils.clone(srcJSON);
        retJSON = retJSON || {};
        var replaceSpecialPropertyValue = function(prop) {
            var propValue = utils.getPropValue(newJSON, prop);
            if (propValue) {
                utils.setPropValue(retJSON, prop, propValue);
            }
        };
        replaceSpecialPropertyValue("plotArea.window.start.categoryAxis");
        replaceSpecialPropertyValue("plotArea.window.end.categoryAxis");
        var _update = function(srcObj, newObj) {
            for (var pro in newObj) {
                if (newObj.hasOwnProperty(pro)) {
                    var newVal = newObj[pro];
                    if (newVal !== undefined) {
                        if ( typeof (newVal) !== "object" || newVal instanceof (Array) || newVal === null) {
                            srcObj[pro] = newVal;
                        } else {
                            var srcVal = srcObj[pro];
                            if (!srcVal) {
                                if (newVal === null) {
                                    srcVal = newVal;
                                } else {
                                    srcVal = srcObj[pro] = {};
                                }
                            } else if (!utils.isObject(srcVal)) {
                                srcVal = srcObj[pro] = {};
                            }
                            _update(srcVal, newVal);
                        }
                    }
                }
            }
        };
        _update(retJSON, newJSON);
        return retJSON;
    };

    utils.substitute = function(str, rest) {
        if (!str) { return ''; }

        for (var i = 1; i < arguments.length; i++) {
            str = str.replace(new RegExp("\\{" + (i - 1) + "\\}", "g"), arguments[i]);
        }

        return str;
    };

    utils.invert = function(object) {
        var result = {};
        for (var key in object) {
            var value = object[key];
            result[value] = key;
        }
        return result;
    };


    /**
     * updates an id with a coding delimeter and a suffix
     * @param {String} id
     * @param {String} suffix
     */
    utils.encode = function(id, suffix) {
        // check to see if the encoding token already exists as we do not want to 
        // encode multiple times
        if( id.indexOf( utils.encodingToken ) > -1 ) {
            return id;
        } else {
            var encodedId = id + utils.encodingToken + suffix;
            return encodedId;
        }
    };
    
    /**
     * decodes an id that has been encoded using utils.encode
     * @param {String} idToDecode
     * @return {Array.<String>} First entry will be decoded id, second entry will be suffix.used to encode
     * 
     * If coding delimeter is not present in the idToDecode then only one entry (idToDecode) will exist in the returned array.
     */
    utils.decode = function(idToDecode) {
        var result = idToDecode.split(utils.encodingToken);
        return result;
    };

    utils.deepEqual = function(source, target) {
        if ( typeof source === 'object' && typeof target === 'object' && utils.isExist(source) && utils.isExist(target)) {
            var key = null;
            for (key in source) {
                if (source.hasOwnProperty(key)) {
                    if (!target.hasOwnProperty(key)) {
                        return false;
                    } else if (!utils.deepEqual(source[key], target[key])) {
                        return false;
                    }
                }
            }
            for (key in target) {
                if (target.hasOwnProperty(key)) {
                    if (!source.hasOwnProperty(key)) {
                        return false;
                    }
                }
            }
            return true;
        } else {
            return source === target;
        }
    };
    
    utils.hasCommonKeyValue = function(source, target) {
        if ( typeof source === 'object' && typeof target === 'object') {
            var key = null;
            for (key in source) {
                if (source.hasOwnProperty(key)) {
                    if (target.hasOwnProperty(key) && utils.deepEqual(source[key], target[key])) {
                        return true;
                    }
                }
            }
            return false;
        }
    };

    utils.isExist = function(o) {
        if ((typeof (o) === 'undefined') || (o === null)) {
            return false;
        }
        return true;
    };

    var genGetterSetter = utils.genGetterSetter = function (name) {
        return function (value) {
            if (arguments.length > 0) {
                this[name] = value;
                return this;
            } else {
                return this[name];
            }
        };
    };

    utils.genGetterSetters = function (prototype, names) {
        names.forEach(function (e) {
            prototype[ e.substring(1) ] = genGetterSetter(e);
        });
    };

    utils.currying = function (fn) {
        var carryArgs = Array.prototype.slice.call(arguments, 1);
        return function () {
            return fn.apply(this, carryArgs.concat( Array.prototype.slice.call(arguments) ) );
        };
    };

    utils.getPropValue = function (obj, propPath) {
        if (obj == null) {
            return undefined;
        }
        var path = propPath.split('.'),
            lastPropName = path.pop(),
            i, len, prop = obj;

        for (i = 0, len = path.length; i < len; i++) {
            prop = prop[ path[i] ];
           if ( prop == null) {
                return undefined;
            }
        }
        return prop[ lastPropName ];
    };

    /**
     * set value to obj on propPath, example:
     * setPropValue({}, "a.b.c", 99) -> {a: {b: {c: 99}}}
     * this function overwrite the existing value(s) if value already exists in obj
    */
    utils.setPropValue = function (obj, propPath, value) {
        var path = propPath.split('.'),
            lastPropName = path.pop(),
            propName, type,
            i, len, prop = obj;
        
        for (i = 0, len = path.length; i < len; i++) {
            propName = path[i];
            type = typeof prop[ propName];

            if ( type !== "object" && type !== "function" ) { // if not object or funciton, give a new object
                prop[ propName ] = {};
            }
            prop = prop[ propName ];
        }
        prop[ lastPropName ] = value;
        return obj;
    };

    /**
     * Delete last node of path from obj
     */
    utils.deletePropValue = function (obj, propPath) {
        var path = propPath.split('.'),
            propName, i, prop = obj;
        for (i = 0; i < path.length; i++) {
            propName = path[i];
            if (prop.hasOwnProperty(propName)) {
                if (i === path.length - 1) {
                    delete prop[propName];
                    break;
                }
                prop = prop[ propName ];
            } else {
                return obj;
            }
        }
        return obj;   
    };
    
    /** this function is used for parameter handle
     *  currentArgs is the arguments that need to check
     *  expectArgs is the rule for each argument
     *  example :
     *  [{typeValidator: validateFunction, isOptional:bool}]
     *  the validateFunction is used to validate the argument, 
     *  isOptional is a flag to determine a parameter is optional, the default value is false
     */
    utils.checkArgs = function(currentArgs, expectArgs) {
        if (!expectArgs) {
            return true;
        } else {
            var currentArg, expectArg;
            for (var i = 0; i < expectArgs.length; i++) {
                currentArg = currentArgs[i];
                expectArg = expectArgs[i];
                if (utils.checkArg(currentArg, expectArg) === false) {
                    return false;
                }
            }
            return true;
        }
    };
    
    utils.checkArg = function(arg, expectedArg) {
        // if no validator return true
        if (!expectedArg.typeValidator) {
            return true;
        } else {
            // when the arg == null, isOptional return true else return false
            if (arg == null) {
                if (expectedArg.isOptional) {
                    return true;
                } else {
                    return false;
                }
            }
            return expectedArg.typeValidator(arg);
        }
    };
    
    utils.isArrayOf = function(arg, validator) {
        if (!utils.isArray(arg)) {
            return false;
        }
        for (var i = arg.length - 1; i >= 0; i--) {
            if (!validator(arg[i])) {
                return false;
            }
        }
        return true;
    }; 
    


    return utils;
});

define('sap/viz/vizservices/common/feed/FeedUtil',[
// @formatter:off
    'sap/viz/vizservices/common/feed/FeedConst',
    'sap/viz/vizservices/common/metadata/MetadataFactory',
    'sap/viz/vizservices/common/metadata/bindingdef/BindingDefUtils',
    'sap/viz/vizservices/common/utils/Utils'
], function(
    FeedConst,
    MetadataFactory,
    BindingDefUtils,
    Utils
) {
// @formatter:on
    /**
     * FeedUtil Class
     */
    var FeedUtil = {};

    FeedUtil.genFeedItem = function(id, values) {
        return {
            'id' : id,
            'values' : values
        };
    };

    FeedUtil.genAnalysisObject = function(id, type, dataType) {
        return {
            'id' : id,
            'type' : type,
            'dataType' : dataType
        };
    };

    FeedUtil.hasMND = function(feeds) {
        return FeedUtil.countAnalyses(feeds, FeedConst.TYPE_MND) > 0;
    };

    FeedUtil.countAnalyses = function(feeds, type) {
        var number = 0;

        for (var i = 0; i < feeds.length; i++) {
            var feed = feeds[i];
            var values = feed.values;
            if (type) {
                for (var j = 0; j < values.length; j++) {
                    var analysis = values[j];
                    if (analysis.type === type) {
                        number++;
                    }
                }
            } else {
                number += values.length;
            }
        }
        return number;
    };

    /**
     * Justify whether valus has mnd
     */
    FeedUtil.hasMNDInValues = function(values) {
        return (FeedUtil.indexOfMNDInValues(values) !== -1);
    };
    /**
     * Get mnd value index of values of src feedItem's values
     */
    FeedUtil.indexOfMNDInValues = function(values) {
        if (!values || !values.length) {
            return -1;
        }
        var indexMND = -1;
        for (var i = 0; i < values.length; i++) {
            var value/*AnalysisObject*/ = values[i];
            if (value.type === FeedConst.TYPE_MND) {
                indexMND = i;
                break;
            }
        }
        return indexMND;
    };

    /**
     * generate empty feeds if has empty fromFeeds
     * @param{String} vizType
     * @return{Object} emptyFeeds
     */
    FeedUtil.buildEmptyFeeds = function(visualizationType) {
        var metadata = MetadataFactory.get(visualizationType);
        var defs = metadata.getBindingDefs();
        var feeds = [];
        defs.forEach(function(def) {
            feeds.push(FeedUtil.genFeedItem(def.id(), []));
        });

        return feeds;
    };

    FeedUtil.merge = function(host, client) {
        var clientMap = FeedUtil._getFeedsValuesMap(client);
        for (var i = 0; i < host.length; i++) {
            // FeedItem
            var fi = host[i];
            if (clientMap[fi.id]) {
                fi.values = fi.values.concat(clientMap[fi.id]);
            }
        }
        return host;
    };

    FeedUtil._getFeedsValuesMap = function(feeds) {
        var feedsValuesMap = {};
        for (var i = 0; i < feeds.length; i++) {
            var feed = feeds[i];
            var id = feed.id;
            if (!feedsValuesMap[id]) {
                feedsValuesMap[id] = feed.values;
            } else {
                feedsValuesMap[id] = feedsValuesMap[id].concat(feed.values);
            }
        }
        return feedsValuesMap;
    };

    FeedUtil.getFeed = function(feeds, id) {
        for (var i = 0; i < feeds.length; i++) {
            var fi = feeds[i];
            if (fi.id === id) {
                return fi;
            }
        }
        return null;
    };

    FeedUtil.getFeedValues = function(feeds, id) {
        var feed = FeedUtil.getFeed(feeds, id);
        return feed ? feed.values : null;
    };

    function measureNamesMatch(aoMeasureNames, defMeasureNames) {
        if (!aoMeasureNames || !defMeasureNames) {
            return false;
        }
        if (aoMeasureNames.length !== defMeasureNames.length) {
            return false;
        }
        var isMatch = defMeasureNames.every(function(measureName) {
            return aoMeasureNames.indexOf(measureName) > -1;
        });
        return isMatch;
    }

    FeedUtil.getMNDEnumeration = function(type) {
        var metadata = MetadataFactory.get(type);
        var defs = metadata.getBindingDefs();
        var enuMeasures = [];
        defs.forEach(function(def) {
            if (def.mndEnumerable()) {
                enuMeasures.push(def.id());
            }
        });
        return enuMeasures;
    };

    FeedUtil.validateMND = function(type, analysisObject) {
        //backwards for the scenario without measureNames
        if (!analysisObject.hasOwnProperty("measureNames")) {
            return true;
        }
        return analysisObject.hasOwnProperty("measureNames") &&
            measureNamesMatch(analysisObject.measureNames, FeedUtil.getMNDEnumeration(type));
    };

    FeedUtil.validateMndAddMeasureNames = function(type, analysisObject) {
        var validateResult = FeedUtil.validateMND(type, analysisObject);
        if (validateResult && !analysisObject.hasOwnProperty("measureNames")) {
            analysisObject.measureNames = FeedUtil.getMNDEnumeration(type);
        }
        return validateResult;
    };

    FeedUtil.spliceAnalysisObjects = function(feeds, feedId, index, howMany, analysisObject1, analysisObject2) {
        var args = Array.prototype.slice.call(arguments, 2);
        var spliced = false;
        feeds.forEach(function(feedItem) {
            if (feedItem.id === feedId) {
                var values = feedItem.values || [];
                values.splice.apply(values, args);
                spliced = true;
            }
        });
        if (!spliced && analysisObject1) {
            var values = [];
            values.splice.apply(values, args);
            feeds.push(FeedUtil.genFeedItem(feedId, values));
        }
        return feeds;
    };

    FeedUtil.cloneFeeds = function(feedItems) {
        return JSON.parse(JSON.stringify(feedItems));
    };
    
    /**
     *  remove the invalid feed item according to the chart type
     */
    FeedUtil.hasInvalidFeeds = function(type, feeds) {
        for (var i = 0;i<feeds.length; i++){
            var bindingDef = BindingDefUtils.get(type, feeds[i].id);
            if (!bindingDef) {
                return true;
            } 
        }
        return false;
    }; 
    
    /**
     *  remove the invalid feed item according to the chart type
     */
    FeedUtil.removeInvalid = function(type, feeds) {
        return feeds.filter(function(feedItem) {
            var bindingDef = BindingDefUtils.get(type, feedItem.id);
            // Reomve the invalid feed item
            if (!bindingDef) {
                return false;
            } else {
                feedItem.values = feedItem.values.filter(function(value) {
                    var support = BindingDefUtils.support(bindingDef, value);
                    return value.type === FeedConst.TYPE_MND ?
                        (support && FeedUtil.validateMND(type, value)) : support;
                });
                return true;
            }
        });
    }; 
    
    FeedUtil.isAnalysisDataType = function (dataType) {
        if (dataType === FeedConst.DATA_TYPE_STRING || 
            dataType === FeedConst.DATA_TYPE_NUMBER || 
            dataType === FeedConst.DATA_TYPE_DATE) {
            return true;
        } else{
            return false;
        }
    };
    FeedUtil.isAnalysisObject = function(arg) {
        // @formatter:off
        return arg && 
            Utils.checkArg(arg.id, {'typeValidator' : Utils.isString}) && 
            Utils.checkArg(arg.type, {'typeValidator' : Utils.isString}) && 
            Utils.checkArg(arg.dataType, {'typeValidator' : FeedUtil.isAnalysisDataType, 'isOptional' : true});
        // @formatter:on
    }; 
    
    FeedUtil.isArrayOfAnalysisObject = function(arg) {
        return Utils.isArrayOf(arg, FeedUtil.isAnalysisObject);
    };
    
    FeedUtil.isFeedItem = function(arg) {
        // @formatter:off
        return arg && 
            Utils.checkArg(arg.id, {'typeValidator' : Utils.isString}) && 
            Utils.checkArg(arg.values, {'typeValidator' : FeedUtil.isArrayOfAnalysisObject});
        // @formatter:on
    };
    
    FeedUtil.isArrayOfFeedItem = function(arg) {
        return Utils.isArrayOf(arg, FeedUtil.isFeedItem);
    };

    return FeedUtil;
});

// @formatter:off
define('sap/viz/vizservices/service/bvr/feeders/MNDFeeder',[
    'sap/viz/vizservices/common/metadata/MetadataFactory',
    'sap/viz/vizservices/common/feed/FeedUtil',
    'sap/viz/vizservices/common/metadata/bindingdef/BindingDefConst',
    'sap/viz/vizservices/common/feed/FeedConst'
],
function(MetadataFactory, FeedUtils, BindingDefConst, FeedConst) {
// @formatter:on
    var MNDFeeder = {};
    
    // Process "inResult" dimension, we should put "MND" before "inResult" dimensions.
    function putMNDBeforeInResult(values, mnd){
        var k = values.length - 1;
        for(; k >= 0 && values[k].inResult; --k){
        }
        values.splice(k + 1, 0, mnd);
    }
    MNDFeeder.feed = function(visualizationType, feeds, analysisObjects) {
        var i, def;
        var index = FeedUtils.indexOfMNDInValues(analysisObjects);
        if (index === -1 || FeedUtils.hasMND(feeds)) {
            return;
        }
        var mnd = analysisObjects.splice(index, 1)[0],values;
        // Get binding defs
        var defs = MetadataFactory.get(visualizationType).getBindingDefs();
        defs = defs.slice(0).sort(function(def1, def2) {
            return def1.bvrMNDPriority() - def2.bvrMNDPriority();
        });

        // Feed when min validate failed 
        // When UI5 supports "info/combinationEx", it should check (def.mndMode() === BindingDefConst.MND_MODE_SUPPORT_EXCLUSIVELY && values.length === 0).
        for ( i = 0; i < defs.length; i++) {
            def = defs[i];
            values = FeedUtils.getFeedValues(feeds, def.id());
            if (values && def.mndMode() !== BindingDefConst.MND_MODE_NONE && def.min() > values.length) {
                if (def.mndMode() === BindingDefConst.MND_MODE_SUPPORT || def.mndMode() === BindingDefConst.MND_MODE_ONLY) { 
                    putMNDBeforeInResult(values, mnd)
                    return;
                }
            }
        }

        // Handle trellis chart, when the visualizationType is trellis and no feedItem in trellisRow or trellisCulumn
        // feed the trellisRow first
        var row = FeedUtils.getFeed(feeds, FeedConst.ID_TRELLIS_ROW),
            column = FeedUtils.getFeed(feeds, FeedConst.ID_TRELLIS_COLUMN);
        if (row && column && row.values.length === 0 && column.values.length === 0) {
            putMNDBeforeInResult(row.values, mnd)
            return;
        }
        
        // Feed when empty
        for ( i = 0; i < defs.length; i++) {
            def = defs[i];
            values = FeedUtils.getFeedValues(feeds, def.id());
            if (values && def.mndMode() !== BindingDefConst.MND_MODE_NONE && values.length === 0) {
                putMNDBeforeInResult(values, mnd);
                return;
            }
        }
        
        // Don't need mnd when there is only one measure binding and one value in this binding.
        var isNeedMnd = false, msrBindingCount = 0;
        for ( i = 0; !isNeedMnd && i < defs.length; i++) {
            def = defs[i];
            if (def.type() === "Measure") {
                msrBindingCount++;
                values = FeedUtils.getFeedValues(feeds, def.id());
                isNeedMnd = msrBindingCount > 1 || (values && values.length > 1) ;
            }
        }
        if (!isNeedMnd) {
            return;
        }

        // Feed to else
        for ( i = 0; i < defs.length; i++) {
            def = defs[i];
            values = FeedUtils.getFeedValues(feeds, def.id());
            if (values && def.mndMode() === BindingDefConst.MND_MODE_SUPPORT) {
                putMNDBeforeInResult(values, mnd);
                return;
            }
        }
    };
    return MNDFeeder;
});

define('sap/viz/vizservices/common/viz/ChartConst',[
], function() {
    
    var ChartConst = {};
    
    
    // chart Type -------------------------------------------------------
    /**
     * Bar chart, the dataset is sap.viz.api.data.FlatTableDataset.
     */
    ChartConst.TYPE_BAR = "info/bar";
    ChartConst.TYPE_STACKED_BAR = "info/stacked_bar";
    ChartConst.TYPE_100_STACKED_BAR = "info/100_stacked_bar";
    ChartConst.TYPE_DUAL_BAR = "info/dual_bar";
    ChartConst.TYPE_DUAL_STACKED_BAR = "info/dual_stacked_bar";
    ChartConst.TYPE_100_DUAL_STACKED_BAR = "info/100_dual_stacked_bar";
    
    // trellis    
    ChartConst.TYPE_TRELLIS_BAR = "info/trellis_bar";
    ChartConst.TYPE_TRELLIS_STACKED_BAR = "info/trellis_stacked_bar";
    ChartConst.TYPE_TRELLIS_100_STACKED_BAR = "info/trellis_100_stacked_bar";
    ChartConst.TYPE_TRELLIS_DUAL_BAR = "info/trellis_dual_bar";
    ChartConst.TYPE_TRELLIS_DUAL_STACKED_BAR = "info/trellis_dual_stacked_bar";
    ChartConst.TYPE_TRELLIS_100_DUAL_STACKED_BAR = "info/trellis_100_dual_stacked_bar";
    
    /**
     * Column chart, the dataset is sap.viz.api.data.FlatTableDataset.
     */
    ChartConst.TYPE_COLUMN = "info/column";
    ChartConst.TYPE_STACKED_COLUMN = "info/stacked_column";
    ChartConst.TYPE_100_STACKED_COLUMN = "info/100_stacked_column";
    ChartConst.TYPE_DUAL_COLUMN = "info/dual_column";
    ChartConst.TYPE_DUAL_STACKED_COLUMN = "info/dual_stacked_column";
    ChartConst.TYPE_100_DUAL_STACKED_COLUMN = "info/100_dual_stacked_column";
    
    // trellis
    ChartConst.TYPE_TRELLIS_COLUMN = "info/trellis_column";
    ChartConst.TYPE_TRELLIS_STACKED_COLUMN = "info/trellis_stacked_column";
    ChartConst.TYPE_TRELLIS_100_STACKED_COLUMN = "info/trellis_100_stacked_column";
    ChartConst.TYPE_TRELLIS_DUAL_COLUMN = "info/trellis_dual_column";
    ChartConst.TYPE_TRELLIS_DUAL_STACKED_COLUMN = "info/trellis_dual_stacked_column";
    ChartConst.TYPE_TRELLIS_100_DUAL_STACKED_COLUMN = "info/trellis_100_dual_stacked_column";

    /**
     * Time chart, the dataset is sap.viz.api.data.FlatTableDataset.
     */
    ChartConst.TYPE_TIMESERIES_LINE = "info/timeseries_line";
    ChartConst.TYPE_TIMESERIES_SCATTER = "info/timeseries_scatter";
    ChartConst.TYPE_TIMESERIES_BUBBLE = "info/timeseries_bubble";
    ChartConst.TYPE_TIMESERIES_COMBINATION = "info/timeseries_combination";
    ChartConst.TYPE_DUAL_TIMESERIES_COMBINATION = "info/dual_timeseries_combination";

    /**
     * Line chart, the dataset is sap.viz.api.data.FlatTableDataset.
     */
    ChartConst.TYPE_LINE = "info/line";
    ChartConst.TYPE_HORIZONTAL_LINE = "info/horizontal_line";
    ChartConst.TYPE_DUAL_LINE = "info/dual_line";
    ChartConst.TYPE_DUAL_HORIZONTAL_LINE = "info/dual_horizontal_line";
        
    // trellis
    ChartConst.TYPE_TRELLIS_LINE = "info/trellis_line";
    ChartConst.TYPE_TRELLIS_HORIZONTAL_LINE = "info/trellis_horizontal_line";
    ChartConst.TYPE_TRELLIS_DUAL_LINE = "info/trellis_dual_line";
    ChartConst.TYPE_TRELLIS_DUAL_HORIZONTAL_LINE = "info/trellis_dual_horizontal_line";
    

     /**
     * Area chart, the dataset is sap.viz.api.data.FlatTableDataset.
     */
    ChartConst.TYPE_AREA = "info/area";
    ChartConst.TYPE_HORIZONTAL_AREA = "info/horizontal_area";
    ChartConst.TYPE_100_AREA = "info/100_area";
    ChartConst.TYPE_100_HORIZONTAL_AREA = "info/100_horizontal_area";
    
    // trellis
    ChartConst.TYPE_TRELLIS_AREA = "info/trellis_area";
    ChartConst.TYPE_TRELLIS_HORIZONTAL_AREA = "info/trellis_horizontal_area";
    ChartConst.TYPE_TRELLIS_100_AREA = "info/trellis_100_area";
    ChartConst.TYPE_TRELLIS_100_HORIZONTAL_AREA = "info/trellis_100_horizontal_area";
    
    
     /**
     * WaterFall chart, the dataset is sap.viz.api.data.FlatTableDataset.
     */
    ChartConst.TYPE_WATERFALL = "info/waterfall";
    ChartConst.TYPE_HORIZONTAL_WATERFALL = "info/horizontal_waterfall";
    ChartConst.TYPE_STACKED_WATERFALL = "info/stacked_waterfall";    
    ChartConst.TYPE_HORIZONTAL_STACKED_WATERFALL = "info/horizontal_stacked_waterfall";
    
    
     /**
     * Combination chart, the dataset is sap.viz.api.data.FlatTableDataset.
     */
    ChartConst.TYPE_COMBINATION = "info/combination";
    ChartConst.TYPE_HORIZONTAL_COMBINATION = "info/horizontal_combination";
    ChartConst.TYPE_DUAL_COMBINATION = "info/dual_combination";
    ChartConst.TYPE_DUAL_HORIZONTAL_COMBINATION = "info/dual_horizontal_combination";
    ChartConst.TYPE_STACKED_COMBINATION = "info/stacked_combination";
    ChartConst.TYPE_HORIZONTAL_STACKED_COMBINATION = "info/horizontal_stacked_combination";
    ChartConst.TYPE_DUAL_STACKED_COMBINATION = "info/dual_stacked_combination";
    ChartConst.TYPE_DUAL_HORIZONTAL_STACKED_COMBINATION = "info/dual_horizontal_stacked_combination";
    
    /**
     * @memberof sap.viz.controls.common.constants.ChartConst
     * @member TYPE_MEKKO
     * @static
     */
    ChartConst.TYPE_MEKKO = "info/mekko";
    ChartConst.TYPE_100_MEKKO = "info/100_mekko";
    ChartConst.TYPE_HORIZONTAL_MEKKO = "info/horizontal_mekko";
    ChartConst.TYPE_100_HORIZONTAL_MEKKO = "info/100_horizontal_mekko";
    
    
    /**
     * Pie chart, the dataset is sap.viz.api.data.FlatTableDataset.
     */
    ChartConst.TYPE_PIE = "info/pie";
    // trellis
    ChartConst.TYPE_TRELLIS_PIE = "info/trellis_pie";

    /**
     * Donut chart, the dataset is sap.viz.api.data.FlatTableDataset.
     */
    ChartConst.TYPE_DONUT = "info/donut";
    // trellis
    ChartConst.TYPE_TRELLIS_DONUT = "info/trellis_donut";

     /**
     * Scatter chart, the dataset is sap.viz.api.data.FlatTableDataset.
     */
    ChartConst.TYPE_SCATTER = "info/scatter";
    // trellis
    ChartConst.TYPE_TRELLIS_SCATTER = "info/trellis_scatter";

     /**
     * Bubble chart, the dataset is sap.viz.api.data.FlatTableDataset.
     */
    ChartConst.TYPE_BUBBLE = "info/bubble";
    // trellis
    ChartConst.TYPE_TRELLIS_BUBBLE = "info/trellis_bubble";

     /**
     * Heatmap chart, the dataset is sap.viz.api.data.FlatTableDataset.
     */
    ChartConst.TYPE_HEATMAP = "info/heatmap";
    ChartConst.TYPE_TREEMAP = "info/treemap";

     /**
     * Radar chart, the dataset is sap.viz.api.data.FlatTableDataset.
     */
    ChartConst.TYPE_RADAR = "info/radar";
    // trellis
    ChartConst.TYPE_TRELLIS_RADAR = "info/trellis_radar";

     /**
     * Tag Cloud chart, the dataset is sap.viz.api.data.FlatTableDataset.
     */
    ChartConst.TYPE_TAG_CLOUD = "info/tagcloud";
    
    /**
     * Number chart, the dataset is sap.viz.api.data.FlatTableDataset.
     */
    ChartConst.TYPE_NUMBER = 'info/number';
    
     /**
     * bullet chart, the dataset is sap.viz.api.data.FlatTableDataset.
     */
    ChartConst.TYPE_BULLET = "info/bullet";
    ChartConst.TYPE_VERTICALBULLET = "info/vertical_bullet";

    // Chart direction
    ChartConst.DIRECTION_HORIZONTAL = "horizontal";
    ChartConst.DIRECTION_VERTICAL = "vertical";

    // Chart stacking
    ChartConst.STACKING_FULL = "full";
    ChartConst.STACKING_NORMAL = "normal";
    
    // Chart feeding
    ChartConst.FEEDING_PRIMARY_VALUES = "primaryValues";
    ChartConst.FEEDING_SECONDARY_VALUES = "secondaryValues";
    ChartConst.FEEDING_AXIS_LABELS = "axisLabels";

    ChartConst.MEASURE_NAMES_DIMENSION = "measureNamesDimension";
    ChartConst.MEASURE_VALUES_GROUP = "measureValuesGroup";
    ChartConst.ANALYSIS_AXIS = "analysisAxis";

    // infoChart feeding
    ChartConst.VALUE_AXIS = "valueAxis";
    ChartConst.SECOND_VALUE_AXIS = "valueAxis2";
    ChartConst.CATEGORY_AXIS = "categoryAxis";
    ChartConst.TIME_AXIS = "timeAxis";
    ChartConst.SIZE = "size";
    ChartConst.WEIGHT = "weight";

    ChartConst.INVALID = "Invalid";

    // Chart axis
    ChartConst.AXIS_XAXIS = "xAxis";
    ChartConst.AXIS_XAXIS1 = "xAxis1";
    ChartConst.AXIS_XAXIS2 = "xAxis2";
    ChartConst.AXIS_YAXIS = "yAxis";
    ChartConst.AXIS_YAXIS1 = "yAxis1";
    ChartConst.AXIS_YAXIS2 = "yAxis2";
    ChartConst.COLOR = "color";
    ChartConst.DATA_FRAME = "dataFrame";
    ChartConst.TEMPLATE_INCOMPLETE = "incomplete_ghost";
    ChartConst.TEMPLATE_DEFAULT = "default";
    ChartConst.TEMPLATE_EMPTY = "empty_ghost";
    ChartConst.PLAY_FIELD = "playField";
    ChartConst.SHAPE = "shape";
    ChartConst.TITLE = "title";

    ChartConst.KEY_COUNT = "__keysCount";

    //bit operation
    ChartConst.TRELLIS_NONE = 0;
    ChartConst.TRELLIS_COLUMN = 1;
    ChartConst.TRELLIS_ROW = 2;
    ChartConst.TRELLIS_COLUMN_AND_ROW = 3;

    return ChartConst;
});

// @formatter:off
define('sap/viz/vizservices/service/bvr/feeders/TimeFeeder',[
    'sap/viz/vizservices/common/feed/FeedConst',
    'sap/viz/vizservices/common/metadata/MetadataFactory',
    'sap/viz/vizservices/common/metadata/bindingdef/BindingDefUtils',
    'sap/viz/vizservices/common/viz/ChartConst'
], 
function(FeedConst, 
    MetadataFactory, 
    BindingDefUtils, 
    ChartConst
) {
// @formatter:on
    function isTimeSeriesType(type){
        return [
            ChartConst.TYPE_TIMESERIES_LINE,
            ChartConst.TYPE_TIMESERIES_SCATTER,
            ChartConst.TYPE_TIMESERIES_BUBBLE,
            ChartConst.TYPE_TIMESERIES_COMBINATION,
            ChartConst.TYPE_DUAL_TIMESERIES_COMBINATION
        ].indexOf(type) >= 0;
    }
    var TimeFeeder = {};
    TimeFeeder.feed = function(visualizationType, feeds, analysisObjects) {
        if (!isTimeSeriesType(visualizationType)) {
            return;
        }
        var feed, i;
        for ( i = 0; i < feeds.length; i++) {
            if (feeds[i].id === FeedConst.ID_TIME_AXIS) {
                feed = feeds[i];
            }
        }
        if (!feed) {
            return;
        }
        var bindingDef = BindingDefUtils.get(visualizationType, feed.id);
        if (feed.values.length >= bindingDef.max()) {
            return;
        }

        for ( i = 0; i < analysisObjects.length; i++) {
            if (analysisObjects[i].dataType === FeedConst.DATA_TYPE_DATE) {
                feed.values = [analysisObjects[i]];
                analysisObjects.splice(i, 1);
                break;
            }
        }
    };
    return TimeFeeder;
});

define( "jquery", [], function () { return jQuery; } );

// @formatter:off
define('sap/viz/vizservices/service/feed/validators/AAValidator',[
    'sap/viz/vizservices/common/feed/FeedConst',
    'sap/viz/vizservices/common/feed/FeedUtil',
    'sap/viz/vizservices/common/viz/ChartConst',
    'sap/viz/vizservices/common/metadata/bindingdef/BindingDefConst'
], function(
    FeedConst, 
    FeedUtils, 
    ChartConst,
    BindingDefConst
) {
// @formatter:on
    var AAValidator = {};


    AAValidator.validate = function(defs, feedItems) {
        var numPreFilledAA = 0;
        defs.forEach(function(def) {
            if (def.type() === BindingDefConst.TYPE_DIMENSION) {
                var values = FeedUtils.getFeedValues(feedItems, def.id()) || [];
                if (values.length === 0 && def.min() > 0) {
                    if (def.mndMode() === BindingDefConst.MND_MODE_NONE || FeedUtils.hasMND(feedItems)) {
                        numPreFilledAA++;
                    }
                }
            }
        });
        
        return {
            "valid" : (_countAAOfFeeds(feedItems) + numPreFilledAA) <= 2
        };
    }; 

    var _countAAOfFeeds = function(feedItems) {
        var numDimension = 0;
        var numMultiplier = 0;
        for (var i = 0; i < feedItems.length; i++) {
            var feedItem = feedItems[i];
            if (_countAAOfFeedItem(feedItem)) {
                if (feedItem.id === FeedConst.ID_TRELLIS_ROW || feedItem.id === FeedConst.ID_TRELLIS_COLUMN) {
                    numMultiplier = Math.min(1, numMultiplier + 1);
                } else {
                    numDimension++;
                }
            }
        }
        //CVOM CrossTab DataSet limitation: Max Dimension set count is 2.
        return (numMultiplier + numDimension);
    };
    var _countAAOfFeedItem = function(feedItem) {
        if (!feedItem || !( feedItem.values && feedItem.values.length > 0 ) || feedItem.id === ChartConst.DATA_FRAME) {
            return 0;
        }
        var values = feedItem.values;
        return _countAAOfValues(values);
    };

    var _countAAOfValues = function(values) {
        if (!values || !values.length) {
            return 0;
        }
        var hasMND = FeedUtils.hasMNDInValues(values);
        if (values[0].type === FeedConst.TYPE_MND && values.length === 1) {
            return 0;
        } else if (values[0].type === FeedConst.TYPE_DIMENSION || values[0].type === FeedConst.TYPE_MND){
            return 1;
        } else {
            return 0;
        }
    };
    return AAValidator;
});

// @formatter:off
define('sap/viz/vizservices/service/feed/validators/DuplicateValidator',[
    'sap/viz/vizservices/common/feed/FeedUtil'
], 
function(FeedUtils) {
// @formatter:on
    var DuplicateValidator = {};

    DuplicateValidator.validate = function(defs, feedItems) {
        var validation = {
            "valid" : true,
            "results" :{
                "bindings" : {}
            }
        };

        var result;
        defs.forEach(function(def) {
            var values = FeedUtils.getFeedValues(feedItems, def.id()) || [];
            result = _validateOne(def, values);
            if (result) {
                validation.valid = false;
                validation.results.bindings[def.id()] = result;
            }
        });

        return validation;
    };
    /**
     * Validate whether number of analysis objects exceed the max
     *
     * @param {Object} def
     * @param {Object} analysisObjects
     */
    var _validateOne = function(def, analysisObjects) {
        var map = {}, result;
        analysisObjects.forEach(function(analysisObject) {
            var id = analysisObject.id;
            if (map[id]) {
                if (!result){
                    result = {
                        "incorrect" : []
                    };
                }
                
                result.incorrect.push(analysisObject);
            }
            map[id] = true;
        });
        return result;
    };
    return DuplicateValidator;
});

// @formatter:off
define('sap/viz/vizservices/service/feed/validators/TypeValidator',[
    'sap/viz/vizservices/common/feed/FeedConst',
    'sap/viz/vizservices/common/feed/FeedUtil',
    'sap/viz/vizservices/common/metadata/bindingdef/BindingDefUtils'
], function(
    FeedConst, 
    FeedUtils,
    BindingDefUtils
) {
// @formatter:on
    var TypeValidator = {};

    TypeValidator.validate = function(defs, feedItems) {
        var validation = {
            "valid" : true,
            "results" :{
                "bindings" : {}
            }
        };
        
        var result;
        defs.forEach(function(def) {
            var values = FeedUtils.getFeedValues(feedItems, def.id()) || [];
            result = _validateOne(def, values);
            if(result) {
                 validation.valid = false;
                 validation.results.bindings[def.id()] = result;
            }
        });
        return validation;
    };
    
    var _validateOne = function(def, analysisObjects) {
        var result;
        analysisObjects.forEach(function(analysisObject) {
            // when the bindingDef does not support the analysisObject
            // Check for the time_series chart, the analysisObject's dataType of time_series chart must be "date"
            if (!BindingDefUtils.support(def, analysisObject) ||
                ((def.id() === FeedConst.ID_TIME_AXIS) && analysisObject.dataType !== FeedConst.DATA_TYPE_DATE)){

                if (!result) {
                    result = {
                        "incorrect" : []
                    };
                }
                
                result.incorrect.push(analysisObject);
            }
        });
        return result;
    };


    return TypeValidator;
});

// @formatter:off
define('sap/viz/vizservices/service/feed/validators/MaxValidator',[
    'sap/viz/vizservices/common/feed/FeedUtil'
], 
function(FeedUtils) {
// @formatter:on
    var MaxValidator = {};
    

    MaxValidator.validate = function(defs, feedItems) {
        var validation = {
            "valid" : true,
            "results" :{
                "bindings" : {}
            }
        };

        var result;
        var numRemainingAnalyses = FeedUtils.countAnalyses(feedItems);
        defs.forEach(function(def) {
            var values = FeedUtils.getFeedValues(feedItems, def.id()) || [];
            result = _validateOne(def, values);
            if (result) {
                validation.valid = false;
                validation.results.bindings[def.id()] = result;
            }
            numRemainingAnalyses -= values.length;
        });
        validation.valid = validation.valid && (numRemainingAnalyses === 0);
        return validation;
    }; 


    var _validateOne = function(def, analysisObjects) {
        var length = analysisObjects.length, result;
        if (FeedUtils.hasMNDInValues(analysisObjects)) {
            length = length - 1;
        }
        if (length > def.max()) {
            result = {
                "exceed" : length - def.max()
            };
        }
        return result;
    }; 

    return MaxValidator;
});

// @formatter:off
define('sap/viz/vizservices/service/feed/validators/MinValidator',[
    'sap/viz/vizservices/common/feed/FeedUtil',
    'sap/viz/vizservices/common/metadata/bindingdef/BindingDefConst',
    'sap/viz/vizservices/common/feed/FeedConst',
    'sap/viz/vizservices/common/utils/Utils'
], 
function(FeedUtils, BindingDefConst, FeedConst, Utils) {
// @formatter:on
    var MinValidator = {};
    
    MinValidator.validate = function(defs, feedItems) {
        var validation = {
            "valid" : true,
            "results" :{
                "bindings" : {}
            }
        };

        var hasMND = FeedUtils.hasMND(feedItems);
        var result, allowMND, values = [], trellisCorrect = false;

        defs.forEach(function(def) {
            var analysisObjects = FeedUtils.getFeedValues(feedItems, def.id()) || [];
            result = _validateOne(def, analysisObjects);
            if (def.id() === FeedConst.ID_TRELLIS_ROW || def.id() === FeedConst.ID_TRELLIS_COLUMN) {
                if (!result) {
                    trellisCorrect = true;
                }
            } 
            if (result) {
                    validation.valid = false;
                    if (def.type() === FeedConst.TYPE_DIMENSION) {
                        if (def.mndMode() === BindingDefConst.MND_MODE_SUPPORT || def.mndMode() === BindingDefConst.MND_MODE_ONLY) {
                            allowMND = !hasMND;
                        } else if (def.mndMode() === BindingDefConst.MND_MODE_SUPPORT_EXCLUSIVELY) {
                            allowMND = (analysisObjects.length > 0 ? false : true) && !hasMND;
                        } else {
                            allowMND = false;
                        }
                        result.allowMND = allowMND;
                    }

                    validation.results.bindings[def.id()] = result;
                }
        });

        if (trellisCorrect){
           if (!validation.valid){
               delete validation.results.bindings[FeedConst.ID_TRELLIS_ROW];
               delete validation.results.bindings[FeedConst.ID_TRELLIS_COLUMN];
               if (Utils.isEmptyObject(validation.results.bindings)){
                   validation.valid = true;
               }
           }
        }
        
        return validation;
    };
    var _validateOne = function(def, analysisObjects) {
        var length = analysisObjects.length, result;
        var min = def.min();
        if (def.id() === FeedConst.ID_TRELLIS_ROW || def.id() === FeedConst.ID_TRELLIS_COLUMN) {
            min = 1;
        }
        if(length < min) {
            result = {
                "missing" : min - length
            };
            if (def.id() === FeedConst.ID_TRELLIS_ROW) {
                result.associate = FeedConst.ID_TRELLIS_COLUMN;
            } else if (def.id() === FeedConst.ID_TRELLIS_COLUMN) {
                result.associate = FeedConst.ID_TRELLIS_ROW;
            }
        }
        return result;
    };
    return MinValidator;
});

// @formatter:off
define('sap/viz/vizservices/service/feed/validators/MNDValidator',[
    'sap/viz/vizservices/common/feed/FeedConst',
    'sap/viz/vizservices/common/feed/FeedUtil',
    'sap/viz/vizservices/common/metadata/bindingdef/BindingDefConst',

], function(
    FeedConst,
    FeedUtils,
    BindingDefConst
) {
// @formatter:on
    var MNDValidator = {};


    MNDValidator.validate = function(vizType, defs, feedItems) {
        var validation = {
            "valid" : true,
            "results" :{
                "bindings" : {}
            }
        };

        // Enable MND when measure fed
        var numMeasures = 0;
        defs.forEach(function(def) {
            if (def.mndEnumerable()) {
                var values = FeedUtils.getFeedValues(feedItems, def.id()) || [];
                numMeasures += values.length;
            }
        });
        numMeasures = numMeasures > 0 ? 1 : 0;

        // Validate
        var trellisValues = [], trellisDef;
        
        var result;
        defs.forEach(function(def) {
            if (def.type() === BindingDefConst.TYPE_DIMENSION) {
                var values = FeedUtils.getFeedValues(feedItems, def.id()) || [];
                var mndIndex = FeedUtils.indexOfMNDInValues(values);
                
                if (mndIndex !== -1) {
                    if (!numMeasures) {
                        validation.valid = false;

                        validation.results.bindings[def.id()] = {
                            "incorrect" : [values[mndIndex]]
                        };
                        return;
                    } else {
                        numMeasures--;
                    }
                }

                if ((def.id() === FeedConst.ID_TRELLIS_ROW || def.id() === FeedConst.ID_TRELLIS_COLUMN)) {
                    trellisValues = trellisValues.concat(values);
                    trellisDef = def;
                } else {
                    result = _validateOne(def, values, vizType);
                    if (result) {
                        validation.valid = false;
                        if (!validation.results.bindings[def.id()]) {
                            validation.results.bindings[def.id()] = {
                                "incorrect" : [result]
                            };
                        }
                    }
                }
            }
        });

        if (trellisDef) {
            result = _validateOne(trellisDef, trellisValues, vizType);
            if (result) {
                validation.valid = false;
                if (result) {
                    if (!validation.results[trellisDef.id()]) {
                        validation.results.bindings[trellisDef.id()] = {
                            "incorrect" : [result]
                        };
                    }
                }
            }
        }

        return validation;
    }; 

    /**
     * Validate whether number of analysis objects exceed the max
     *
     * @param {Object} def
     * @param {Object} analysisObjects
     */
   
    var _validateOne = function(def, analysisObjects, vizType) {
        var result;
        var mndIndex = FeedUtils.indexOfMNDInValues(analysisObjects);
        // there is mnd in analysisObjects:
        // 1. the binding does not accept mnd
        // 2. exclusive mnd and the number of analyisisObject is more than one
        // the mnd analysis Object is incorrect
        if (mndIndex !== -1 &&
            (def.mndMode() === BindingDefConst.MND_MODE_NONE ||
             (def.mndMode() === BindingDefConst.MND_MODE_SUPPORT_EXCLUSIVELY && analysisObjects.length > 1) ||
                !FeedUtils.validateMndAddMeasureNames(vizType, analysisObjects[mndIndex]))) {
                result = analysisObjects[mndIndex];
        }
        return result;
    };

    return MNDValidator;
});

// @formatter:off
define('sap/viz/vizservices/service/feed/validators/MissingMNDValidator',[
    'sap/viz/vizservices/common/feed/FeedConst',
    'sap/viz/vizservices/common/feed/FeedUtil',
    'sap/viz/vizservices/common/metadata/bindingdef/BindingDefConst',
    'sap/viz/vizservices/common/utils/Utils',
    'sap/viz/vizservices/common/viz/ChartConst'
], function(
    FeedConst, 
    FeedUtils,
    BindingDefConst,
    Utils,
    ChartConst
) {
// @formatter:on
    var MissingMNDValidator = {};
    
    MissingMNDValidator.validate = function(vizType, defs, feedItems) {
        var validation = {
            "valid" : true,
            "results" : {
                "bindings" : {}
            }
        };
        if (supportChartType.indexOf(vizType) < 0) {
            return validation;
        }

        var hasMND = FeedUtils.hasMND(feedItems);
        if (!hasMND && _countMeasure(defs, feedItems) > 1) {
            validation.valid = false;
            validation.results.missingMND = true;
            defs.forEach(function(def) {
                if (def.type() === FeedConst.TYPE_DIMENSION) {
                    var values = FeedUtils.getFeedValues(feedItems, def.id()) || [];
                    var result = _validateOne(def, values);
                    if (result.allowMND) {
                        validation.results.bindings[def.id()] = result;
                    }
                }
            });
        }
        return validation;
    };
    
    var _countMeasure = function(defs, feedItems) {
       var num = 0;
       defs.forEach(function(def) {
            var values = FeedUtils.getFeedValues(feedItems, def.id()) || [];
            if (def.type() === FeedConst.TYPE_MEASURE) {
                num += Math.min(def.max(), values.length);
            }
        });
        return num;
    };
    
    var _validateOne = function(def, analysisObjects) {
        var result = {};
        if (def.mndMode() === BindingDefConst.MND_MODE_SUPPORT || def.mndMode() === BindingDefConst.MND_MODE_ONLY) {
            result.allowMND = true;
        } else if (def.mndMode() === BindingDefConst.MND_MODE_SUPPORT_EXCLUSIVELY) {
            result.allowMND = analysisObjects.length > 0 ? false : true;
        } else {
            result.allowMND = false;
        }
        return result;
    };

    var supportChartType = [
        // bar
        ChartConst.TYPE_BAR,
        ChartConst.TYPE_TRELLIS_BAR,
        ChartConst.TYPE_DUAL_BAR,
        ChartConst.TYPE_TRELLIS_DUAL_BAR,
        ChartConst.TYPE_STACKED_BAR,
        ChartConst.TYPE_100_STACKED_BAR,
        ChartConst.TYPE_TRELLIS_STACKED_BAR,
        ChartConst.TYPE_TRELLIS_100_STACKED_BAR,
        ChartConst.TYPE_DUAL_STACKED_BAR,
        ChartConst.TYPE_100_DUAL_STACKED_BAR,
        ChartConst.TYPE_TRELLIS_DUAL_STACKED_BAR,
        ChartConst.TYPE_TRELLIS_100_DUAL_STACKED_BAR,
        
        // column
        ChartConst.TYPE_COLUMN,
        ChartConst.TYPE_TRELLIS_COLUMN,
        ChartConst.TYPE_DUAL_COLUMN,
        ChartConst.TYPE_TRELLIS_DUAL_COLUMN,
        ChartConst.TYPE_STACKED_COLUMN,
        ChartConst.TYPE_100_STACKED_COLUMN,
        ChartConst.TYPE_TRELLIS_STACKED_COLUMN,
        ChartConst.TYPE_TRELLIS_100_STACKED_COLUMN,
        ChartConst.TYPE_DUAL_STACKED_COLUMN,
        ChartConst.TYPE_100_DUAL_STACKED_COLUMN,
        ChartConst.TYPE_TRELLIS_DUAL_STACKED_COLUMN,
        ChartConst.TYPE_TRELLIS_100_DUAL_STACKED_COLUMN,
        
        // line
        ChartConst.TYPE_LINE,
        ChartConst.TYPE_TRELLIS_LINE,
        ChartConst.TYPE_HORIZONTAL_LINE,
        ChartConst.TYPE_TRELLIS_HORIZONTAL_LINE,
        ChartConst.TYPE_DUAL_LINE,
        ChartConst.TYPE_DUAL_HORIZONTAL_LINE,
        ChartConst.TYPE_TRELLIS_DUAL_LINE,
        ChartConst.TYPE_TRELLIS_DUAL_HORIZONTAL_LINE,
        
        // area
        ChartConst.TYPE_AREA,
        ChartConst.TYPE_HORIZONTAL_AREA,
        ChartConst.TYPE_100_AREA,
        ChartConst.TYPE_100_HORIZONTAL_AREA,
        ChartConst.TYPE_TRELLIS_AREA,
        ChartConst.TYPE_TRELLIS_HORIZONTAL_AREA,
        ChartConst.TYPE_TRELLIS_100_AREA,
        ChartConst.TYPE_TRELLIS_100_HORIZONTAL_AREA,
        
        // combination
        ChartConst.TYPE_COMBINATION,
        ChartConst.TYPE_HORIZONTAL_COMBINATION,
        ChartConst.TYPE_DUAL_COMBINATION,
        ChartConst.TYPE_DUAL_HORIZONTAL_COMBINATION,
        ChartConst.TYPE_STACKED_COMBINATION,
        ChartConst.TYPE_HORIZONTAL_STACKED_COMBINATION,
        ChartConst.TYPE_DUAL_STACKED_COMBINATION,
        ChartConst.TYPE_DUAL_HORIZONTAL_STACKED_COMBINATION,
        
        // time series
        ChartConst.TYPE_TIMESERIES_LINE,
        ChartConst.TYPE_TIMESERIES_COLUMN,
        ChartConst.TYPE_TIMESERIES_COMBINATION,
        ChartConst.TYPE_DUAL_TIMESERIES_COMBINATION,
       
        // waterfall
        ChartConst.TYPE_STACKED_WATERFALL,
        ChartConst.TYPE_HORIZONTAL_STACKED_WATERFALL ,
        
        // radar
        ChartConst.TYPE_RADAR,
        ChartConst.TYPE_TRELLIS_RADAR
    ];


    return MissingMNDValidator;
});

// @formatter:off
define('sap/viz/vizservices/service/feed/FeedService',[
    'jquery',
    'sap/viz/vizservices/common/metadata/bindingdef/BindingDefUtils',
    'sap/viz/vizservices/common/metadata/bindingdef/BindingDefConst',
    'sap/viz/vizservices/common/feed/FeedUtil',
    'sap/viz/vizservices/common/feed/FeedConst',
    'sap/viz/vizservices/common/data/DatasetTypeConst',
    'sap/viz/vizservices/common/metadata/MetadataFactory',
    'sap/viz/vizservices/service/feed/validators/AAValidator',
    'sap/viz/vizservices/service/feed/validators/DuplicateValidator',
    'sap/viz/vizservices/service/feed/validators/TypeValidator',
    'sap/viz/vizservices/service/feed/validators/MaxValidator',
    'sap/viz/vizservices/service/feed/validators/MinValidator',
    'sap/viz/vizservices/service/feed/validators/MNDValidator',
    'sap/viz/vizservices/service/feed/validators/MissingMNDValidator',
    'sap/viz/vizservices/common/utils/Utils',
    'sap/viz/vizservices/common/metadata/VizMetadata',
    'exports'
], function(
    $,
    BindingDefUtils,
    BindingDefConst,
    FeedUtil,
    FeedConst,
    DatasetTypeConst,
    MetadataFactory,
    AAValidator,
    DuplicateValidator, 
    TypeValidator, 
    MaxValidator, 
    MinValidator, 
    MNDValidator,
    MissingMNDValidator,
    Utils,
    VizMetadata
) {
// @formatter:on
    /**
     * The FeedService check the validity of feed status.
     */
    var FeedService = {};

    FeedService.validate = function(vizType, feedItems) {
        // parameter handle
        // if there is error in parameters throw error
        var expectArguments = [{
            typeValidator : Utils.isString
        }, {
            typeValidator : FeedUtil.isArrayOfFeedItem
        }];

        if (!Utils.checkArgs(arguments, expectArguments) || MetadataFactory.get(vizType) === null) {
            throw Utils.substitute(sap.viz.extapi.env.Language.getResourceString('VIZ_SERVICES_INVALID_PARAMETER'));
        }
        if (FeedUtil.hasInvalidFeeds(vizType, feedItems)) {
            return {
                "valid" : false
            };
        }

        var metadata = MetadataFactory.get(vizType);
        var defs = metadata.getBindingDefs();
        
        // only extension chart that get metadata from menifest needs to do the AA validate
        if ( metadata instanceof VizMetadata) {
            var aaResult = AAValidator.validate(defs, feedItems);
            if (!aaResult.valid) {
                return aaResult;
            }
        }

        var result = {
            "valid" : true
        };
        result = _mergeResult(result, DuplicateValidator.validate(defs, feedItems));
        result = _mergeResult(result, TypeValidator.validate(defs, feedItems));
        result = _mergeResult(result, MinValidator.validate(defs, feedItems));
        result = _mergeResult(result, MaxValidator.validate(defs, feedItems));
        result = _mergeResult(result, MNDValidator.validate(vizType, defs, feedItems));
        result = _mergeResult(result, MissingMNDValidator.validate(vizType, defs, feedItems));

        return result;
    }; 

    var _mergeResult = function(current, adding) {
        if (!adding.valid) {
            current.valid = false;
            if (!current.results) {
                current.results = {};
            }
            
            for (var i = 0; i < adding.results.bindings.length; i++){
                // concat the incorrect Array
                var addingItem = adding.results.bindings[i];
                var currentItem = current.results.bindings[i];
                var addingIncorrect = addingItem.incorrect;
                var currentIncorrect = currentItem.incorrect;
                if (addingIncorrect && currentIncorrect) {
                    currentItem.incorrect = currentIncorrect.concat(addingIncorrect);
                    $.unique(currentItem.incorrect);
                    // delete the incorrect results from adding
                    delete addingItem.incorrect;
                }
            }
            
            // merge the adding to current results
            $.extend(true, current.results, adding.results);
        }
        return current;
    }; 

    /**
     *
     * @param {Object} visualizationType
     * @param {Object} feedItems
     * @param {String} addTo Feed id will be added
     * @param {Object} adding Analysis object will be added
     */
    FeedService.addable = function(visualizationType, feedItems, addTo, adding) {
        if (!adding) {
            var feed = FeedUtil.getFeed(feedItems, addTo);
            var type, dataType;
            
            if (BindingDefUtils.get(visualizationType, feed.id).type() === BindingDefConst.TYPE_DIMENSION) {
                type = FeedConst.TYPE_DIMENSION;
            } else {
                type = FeedConst.TYPE_MEASURE;
            }

            if (addTo === FeedConst.ID_TIME_AXIS) {
                dataType = FeedConst.DATA_TYPE_DATE;
            } else {
                dataType = undefined;
            }
            var id = '__sapVizServicesReserved_' + type + '_' + _unique++;
            adding = FeedUtil.genAnalysisObject(id, type, dataType);
        }

        // Validate overflow
        var feeds = FeedUtil.spliceAnalysisObjects(FeedUtil.cloneFeeds(feedItems), addTo, 0, 0, adding);
        return FeedService.validateOverflow(visualizationType, feeds);
    };

    FeedService.validateOverflow = function(visualizationType, feedItems) {
        var metadata = MetadataFactory.get(visualizationType);
        var defs = metadata.getBindingDefs();
        var validate = true;
        validate = validate && DuplicateValidator.validate(defs, feedItems).valid;
        validate = validate && TypeValidator.validate(defs, feedItems).valid;

        if (metadata.support().dataset[DatasetTypeConst.CROSS_TABLE] && !metadata.support().dataset[DatasetTypeConst.FLAT_TABLE]) {
            validate = validate && AAValidator.validate(defs, feedItems).valid;
        }
        validate = validate && MaxValidator.validate(defs, feedItems).valid;
        validate = validate && MNDValidator.validate(visualizationType, defs, feedItems).valid;
        return validate;
    };


    FeedService.switchable = function (visualizationType, feedItems, switchTo, switching) {
        // Validate switching
        var feeds = FeedUtil.spliceAnalysisObjects(FeedUtil.cloneFeeds(feedItems), switchTo, 0, 0, switching);
        return FeedService.validateSwitching(visualizationType, feeds);
    };

    FeedService.validateSwitching = function(visualizationType, feedItems) {
        var metadata = MetadataFactory.get(visualizationType);
        var defs = metadata.getBindingDefs();
        var validate = true;
        validate = validate && MaxValidator.validate(defs, feedItems).valid;
        validate = validate && MNDValidator.validate(visualizationType, defs, feedItems).valid;
        validate = validate && TypeValidator.validate(defs, feedItems).valid;

        return validate;
    };


    var _unique = 0;

    return FeedService;
});

// @formatter:off
define('sap/viz/vizservices/service/bvr/feeders/CommonFeeder',[
    'sap/viz/vizservices/common/metadata/MetadataFactory',
    'sap/viz/vizservices/common/feed/FeedUtil',
    'sap/viz/vizservices/common/feed/FeedConst',
    'sap/viz/vizservices/service/feed/FeedService'
],
 function(MetadataFactory, 
     FeedUtils, 
     FeedConst, 
     FeedService
) {
// @formatter:on
    var CommonFeeder = {};
    CommonFeeder.feed = function(visualizationType, feeds, analysisObjects, inScopeFeeds) {
        inScopeFeeds = inScopeFeeds || feeds;
        var copyAnalysisObjects = analysisObjects.slice(0), feed, feedOneSuccess;
        // Get binding defs
        var defs = MetadataFactory.get(visualizationType).getBindingDefsWithBVRSorting();

        var i, def;
        
        // Feed when min validate failed
        for ( i = 0; i < defs.length && analysisObjects.length > 0; i++) {
            def = defs[i], feed = FeedUtils.getFeed(inScopeFeeds, def.id()), feedOneSuccess = true;
            while (feedOneSuccess && feed && def.min() > feed.values.length) {
                feedOneSuccess = _feedOne(visualizationType, feeds, feed, analysisObjects);
            }
        }

        // Handle trellis chart, when the visualizationType is trellis and no feedItem in trellisRow or trellisCulumn
        // feed the trellisRow first
        var row = FeedUtils.getFeed(inScopeFeeds, FeedConst.ID_TRELLIS_ROW),
            column = FeedUtils.getFeed(inScopeFeeds, FeedConst.ID_TRELLIS_COLUMN);
        if (row && column && row.values.length === 0 && column.values.length === 0) {
            _feedOne(visualizationType, feeds, row, analysisObjects);
        }

        
        // Feed when empty
        for ( i = 0; i < defs.length && analysisObjects.length > 0; i++) {
            def = defs[i], feed = FeedUtils.getFeed(inScopeFeeds, def.id()), feedOneSuccess = true;
            if (feed && feed.values.length === 0) {
                _feedOne(visualizationType, feeds, feed, analysisObjects);
            }

        }
        // Feed to else
        for ( i = 0; i < defs.length && analysisObjects.length > 0; i++) {
            def = defs[i], feed = FeedUtils.getFeed(inScopeFeeds, def.id()), feedOneSuccess = true;
            while (feedOneSuccess && feed && def.max() > feed.values.length) {
                feedOneSuccess = _feedOne(visualizationType, feeds, feed, analysisObjects);
            }
        }
    };

    var _feedOne = function(visualizationType, feeds, feed, analysisObjects) {
        for (var i = 0; i < analysisObjects.length; i++) {
            var analysisObject = analysisObjects[i];
            if (FeedService.addable(visualizationType, feeds, feed.id, analysisObject)) {
                feed.values.push(analysisObject);
                analysisObjects.splice(i, 1);
                return true;
            }
        }
        return false;
    };

    return CommonFeeder;
});



// @formatter:off
define('sap/viz/vizservices/service/bvr/switch/AliasMapping',[
    'sap/viz/vizservices/common/feed/FeedUtil',
    'sap/viz/vizservices/service/feed/FeedService',
    'sap/viz/vizservices/common/feed/FeedConst',
    'sap/viz/vizservices/common/metadata/bindingdef/BindingDefUtils',
    'sap/viz/vizservices/common/metadata/bindingdef/BindingDefConst'
], function(
    FeedUtil,
    FeedService,
    FeedConst,
    BindingDefUtils,
    BindingDefConst
) {
// @formatter:on
    var AliasMapping = {};
    var _mapping = {
        //XY, XYY, Bubble, Pie, Scatter, TreeMap, HeatMap, TagCloud, TimeLine, TimeScatter, Numeric, Radar, Bullet, Waterfall, StackedWaterfall, HichertVariance.
        "XY" : {
            "mapTo" : [
                "TimeScatter",
                "Pie", 
                "Scatter", 
                "Bubble", 
                "TreeMap", 
                "HeatMap", 
                "TagCloud", 
                "Numeric", 
                "Bullet"
                ],
            "categoryAxis" : {
                 "Bullet,HeatMap" : "categoryAxis",
                 "Bubble,Pie,Scatter,TimeScatter" : "color",
                 "TreeMap" : "title",
                 "TagCloud" : "text"
             },
             "color" : {
                 "Bullet" : "color",
                 "Bubble,Scatter,TimeScatter" : "shape",
                 "HeatMap" : "categoryAxis2"
             },
            "valueAxis" : {
                 "Bubble,Scatter,TimeScatter": "valueAxis",
                 "Pie" : "size",
                 "TreeMap,TagCloud" : "weight",
                 "HeatMap" : "color",
                 "Numeric" : "value",
                 "Bullet" : "actualValues"
             },
            "dataFrame" : {
                 "Bubble,Pie,Scatter,TagCloud" : "dataFrame"
             },
            "trellisRow" : {
                 "Bubble,Scatter,Pie" : "trellisRow"
            },
            "trellisColumn" : {
                 "Bubble,Scatter,Pie" : "trellisColumn"
            }
         },
         "Pie" : {
            "mapTo" : [ 
                "XYY",
                "Scatter", 
                "Bubble",
                "TreeMap", 
                "HeatMap", 
                "TagCloud", 
                "TimeLine",
                "TimeScatter",
                "Numeric", 
                "Radar", 
                "Bullet", 
                "Waterfall", 
                "StackedWaterfall",
                "HichertVariance",
                "TimeCombination"
                ],
            "size" : {
                "XYY,Scatter,Bubble,Radar,Waterfall,StackedWaterfall,TimeLine,TimeScatter,HichertVariance,TimeCombination" : "valueAxis",
                "Numeric" : "value",
                "Bullet" : "actualValues",
                "TreeMap,TagCloud" : "weight",
                "HeatMap" : "color",
            },
            "color" : {
                "XYY,Bullet,HeatMap,Radar,Waterfall,StackedWaterfall,HichertVariance" : "categoryAxis",
                "TreeMap" : "title",
                "TagCloud" : "text",
                "Scatter,Bubble,TimeLine,TimeScatter,TimeCombination" : "color"
            },
            "dataFrame" : {
                "XYY,Scatter,Bubble,TagCloud,Radar" : "dataFrame",
            },
            "trellisRow" : {
                 "XYY,Scatter,Bubble,Radar" : "trellisRow"
            },
            "trellisColumn" : {
                 "XYY,Scatter,Bubble,Radar" : "trellisColumn"
            }
        },
        "XYY" : {
            "mapTo" : [
                "TreeMap", 
                "HeatMap", 
                "TagCloud", 
                "Numeric", 
                "Bullet",
                "Bubble",
                "Scatter",
                "TimeScatter"
                ],
            "categoryAxis" : {
                "Bullet,HeatMap" : "categoryAxis",
                "TreeMap" : "title",
                "TagCloud" : "text",
                "Bubble,Scatter,TimeScatter" : "color"
            },
            "color" : {
                "Bullet" : "color",
                "HeatMap" : "categoryAxis2",
                "Bubble,Scatter,TimeScatter" : "shape"
            },
            "valueAxis" : {
                "TreeMap,TagCloud" : "weight",
                "HeatMap" : "color",
                "Numeric" : "value",
                "Bullet" : "actualValues",
                "Bubble,Scatter,TimeScatter" : "valueAxis"
            },
            "valueAxis2" : {
                "Bullet" : "targetValues",
                "Bubble,Scatter" : "valueAxis2"
            },
            "dataFrame" : {
                "TagCloud" : "dataFrame",
                "Bubble,Scatter" : "dataFrame"
            }
        },
        "TimeLine" : {
            "mapTo" : [
                "TagCloud",
                "TreeMap",
                "HeatMap",
                "Bullet", 
                "Radar", 
                "Waterfall", 
                "StackedWaterfall",
                "Numeric",
                "HichertVariance"
                ],
            "valueAxis" : {
                "Radar,Waterfall,StackedWaterfall" : "valueAxis",
                "HeatMap" : "color",
                "Bullet" : "actualValues",
                "TreeMap,TagCloud" : "weight",
                "Numeric" : "value"
            },
            "color" : {
                "HeatMap,Bullet,Radar,Waterfall,StackedWaterfall,HichertVariance" : "categoryAxis",
                "TreeMap" : "title",
                "TagCloud" : "text"
            },
            "timeAxis" : {
                "TimeCombination" : "timeAxis"
            }
        },
        "TimeCombination" : {
            "mapTo" : [
                "XY",
                "TagCloud",
                "TreeMap",
                "HeatMap",
                "Bullet", 
                "Radar", 
                "Waterfall", 
                "StackedWaterfall",
                "Numeric",
                "HichertVariance"
                ],
            "color" : {
                "XY,Bullet,HeatMap,Radar,Waterfall,StackedWaterfall,HichertVariance" : "categoryAxis",
                "TagCloud" : "text",
                "TreeMap" : "title"
            },
            "valueAxis" : {
                "TagCloud,TreeMap" : "weight",
                "HeatMap" : "color",
                "Bullet" : "actualValues",
                "Numeric" : "value"
            },
            "valueAxis2" : {
                "TagCloud,TreeMap" : "color"
            }
        },
        "TimeScatter" : {
            "mapTo" : [
                "Scatter",
                "TagCloud",
                "TreeMap",
                "HeatMap",
                "Bullet", 
                "Radar", 
                "Waterfall", 
                "StackedWaterfall",
                "Numeric",
                "HichertVariance"
                ],
            "valueAxis" : {
                "Scatter,Radar,Waterfall,StackedWaterfall" : "valueAxis",
                "HeatMap" : "color",
                "Bullet" : "actualValues",
                "TreeMap,TagCloud" : "weight",
                "Numeric" : "value"
            },
            "color" : {
                "Scatter" : "color",
                "HeatMap,Bullet,Radar,Waterfall,StackedWaterfall,HichertVariance" : "categoryAxis",
                "TreeMap" : "title",
                "TagCloud" : "text"
            },
            "shape" : {
                "Scatter" : "shape",
                "HeatMap" : "categoryAxis2",
                "Bullet,Radar,StackedWaterfall" : "color"
            },
            "bubbleWidth" : {
                "Scatter,HichertVariance" : "valueAxis2",
                "TagCloud,TreeMap" : "color",
                "Bullet" : "targetValues"
            }
        },
        "Bubble" : {
            "mapTo" : [
                "TreeMap", 
                "HeatMap", 
                "TagCloud", 
                "Numeric", 
                "Radar", 
                "Bullet", 
                "Waterfall", 
                "StackedWaterfall",
                "HichertVariance"
                ],
            "valueAxis" : {
                "Radar,Waterfall,StackedWaterfall" : "valueAxis",
                "HeatMap" : "color",
                "Bullet" : "actualValues",
                "TreeMap,TagCloud" : "weight",
                "Numeric" : "value"
            },
            "valueAxis2" : {
                "Bullet" : "targetValues",
                "TreeMap,TagCloud" : "color"
            },
            "shape" : {
                "Bullet,Radar,StackedWaterfall" : "color",
                "HeatMap" : "categoryAxis2"
            },
            "color" : {
                "HeatMap,Bullet,Radar,Waterfall,StackedWaterfall,HichertVariance" : "categoryAxis",
                "TreeMap" : "title",
                "TagCloud" : "text"
            },
            "bubbleWidth" : {
                "Bullet" : "additionalValues"
            },
            "dataFrame" : {
                "TagCloud,Radar" : "dataFrame"
            },
            "trellisRow" : {
                 "Radar" : "trellisRow"
            },
            "trellisColumn" : {
                 "Radar" : "trellisColumn"
            }
        },
        "Scatter" : {
            "mapTo" : [
                "TreeMap", 
                "HeatMap", 
                "TagCloud", 
                "Numeric", 
                "Radar", 
                "Bullet", 
                "Waterfall", 
                "StackedWaterfall",
                "HichertVariance"
                ],
            "valueAxis" : {
                "Radar,Waterfall,StackedWaterfall" : "valueAxis",
                "HeatMap" : "color",
                "Bullet" : "actualValues",
                "TreeMap,TagCloud" : "weight",
                "Numeric" : "value"
            },
            "valueAxis2" : {
                "Bullet" : "targetValues",
                "TreeMap,TagCloud" : "color"
            },
            "shape" : {
                "Bullet,Radar,StackedWaterfall" : "color",
                "HeatMap" : "categoryAxis2"
            },
            "color" : {
                "Bullet,HeatMap,Radar,Waterfall,StackedWaterfall,HichertVariance" : "categoryAxis",
                "TreeMap" : "title",
                "TagCloud" : "text",
                
            },
            "dataFrame" : {
                "Pie,TagCloud,Radar" : "dataFrame"
            },
            "trellisRow" : {
                 "Radar" : "trellisRow"
            },
            "trellisColumn" : {
                 "Radar" : "trellisColumn"
            }
        },
        "TreeMap" : {
            "mapTo" : [
                "HeatMap", 
                "TagCloud", 
                "Numeric", 
                "Radar", 
                "Bullet", 
                "Waterfall", 
                "StackedWaterfall",
                "HichertVariance"
                ],
            "title" : {
                "Bullet,HeatMap,Radar,Waterfall,StackedWaterfall,HichertVariance" : "categoryAxis",
                "TagCloud" : "text"
            },
            "color" : {
                "HeatMap,TagCloud" : "color",
                "Bullet" : "targetValues",
                "HichertVariance" : "valueAxis2"
            },
            "weight" : {
                "Radar,Waterfall,StackedWaterfall,HichertVariance" : "valueAxis",
                "Bullet" : "actualValues",
                "Numeric" : "value",
                "TagCloud" : "weight"
            }
        },
        "TagCloud" : {
            "mapTo" : [
                "Numeric", 
                "Radar", 
                "Bullet", 
                "HeatMap",
                "Waterfall", 
                "StackedWaterfall",
                "HichertVariance"
                ],
            "text" : {
                "Bullet,Radar,HeatMap,Waterfall,StackedWaterfall,HichertVariance" : "categoryAxis"
            },
            "color" : {
                "HeatMap" : "color",
                "Bullet" : "targetValues",
                "HichertVariance" : "valueAxis2"
            },
            "weight" : {
                "Waterfall,Radar,StackedWaterfall,HichertVariance" : "valueAxis",
                "Bullet" : "actualValues",
                "Numeric" : "value"
            },
            "dataFrame" : {
                "Radar" : "dataFrame",
            }
        },
        "HeatMap" : {
            "mapTo" : [
                "Numeric", 
                "Radar", 
                "Bullet",
                "Waterfall", 
                "StackedWaterfall",
                "HichertVariance"
                ],
            "categoryAxis" : {
                "Bullet,Radar,Waterfall,StackedWaterfall,HichertVariance" : "categoryAxis"
            },
            "color" : {
                "Radar,Waterfall,StackedWaterfall,HichertVariance" : "valueAxis",
                "Numeric" : "value",
                "Bullet" : "actualValues"
            },
            "categoryAxis2" : {
                "Bullet,Radar,StackedWaterfall" : "color"
            }
        },
        "Bullet" : {
            "mapTo" : [
                "Numeric",
                "Radar",
                "Waterfall", 
                "StackedWaterfall",
                "HichertVariance"
                ],
            "categoryAxis" : {
                "Radar,Waterfall,StackedWaterfall,HichertVariance" : "categoryAxis"
            },
            "color" : {
                "Radar,StackedWaterfall" : "color"
            },
            "actualValues" : {
                "Radar,Waterfall,StackedWaterfall,HichertVariance" : "valueAxis",
                "Numeric" : "value"
            },
            "targetValues" : {
                "HichertVariance" : "valueAxis2"
            },
            "additionalValues" : {
                "HichertVariance" : "variance1"
            },
            "forecastValues" : {
                "HichertVariance" : "variance2"
            }
        },
        "Radar" : {
            "mapTo" : [
                "Numeric"
                ],
            "valueAxis" : {
                "Numeric" : "value"
            }
        },
        "Waterfall" : {
            "mapTo" : [
                "Numeric"
                ],
            "valueAxis" : {
                "Numeric" : "value"
            }
        },
        "StackedWaterfall" : {
            "mapTo" : [
                "Numeric"
                ],
            "valueAxis" : {
                "Numeric" : "value"
            }
        },
        "HichertVariance" : {
            "mapTo" : [
                "Numeric"
            ],
            "valueAxis" : {
                "Numeric" : "value"
            }
        }
    };
    
    var _addReversedCategory = function (fromCategory, toCategory) {
        if (!fromCategory || !toCategory) {
            return;
        }
        if (!_mapping.hasOwnProperty(toCategory)) {
            _mapping[toCategory] = {
                "mapTo" : [fromCategory]
            };
        } else {
            var mapTo = _mapping[toCategory].mapTo || [];
            if (mapTo.indexOf(fromCategory) === -1) {
                mapTo.push(fromCategory);
            }
            _mapping[toCategory].mapTo = mapTo;
        }
    };

    var _traverseAndCreate = function (tree) {
        if (arguments.length === 1) {
            return tree;
        }
        var level = arguments[1];
        if (!tree.hasOwnProperty(level)) {
            tree[level] = {};
        }
        var args = Array.prototype.slice.call(arguments, 0);
        args.splice(0, 2, tree[level]);
        return _traverseAndCreate.apply(null, args);
    };

    var _addMapping = function(fromCategory, fromFeed, toCategory, toFeed) {
        if (!fromCategory || !toCategory || fromCategory === toCategory) {
            return;
        }
        // mapping.fromCategory.fromFeed
        var Mapping_fromCategory_fromFeed = _traverseAndCreate(_mapping, fromCategory, fromFeed);

        // If already exists other fromFeed->toFeed for fromCategory, update the mapping.
        var alreadyExist = Object.keys(Mapping_fromCategory_fromFeed).some(function(existingToCategories) {
            if (Mapping_fromCategory_fromFeed[existingToCategories] === toFeed) {
                // Mapping does not exists.
                if (existingToCategories.split(',').indexOf(toCategory) < 0) {
                    Mapping_fromCategory_fromFeed[existingToCategories + ',' + toCategory] = toFeed;
                    delete Mapping_fromCategory_fromFeed[existingToCategories];
                }
                return true;
            }
        });
        // Not exists fromFeed -> toFeed for fromCategory, add new one.
        if (!alreadyExist) {
            Mapping_fromCategory_fromFeed[toCategory] = toFeed;
        }
    }; 

    // Generate reverse mapping: fromCategory.fromFeed.toCategories.toFeed -> toCategory.toFeed.fromCategories.fromFeed
    var fromCategory, toCategories, fromFeed, toFeed, toCategoriesArray;

    for (fromCategory in _mapping) {
        for (fromFeed in _mapping[fromCategory]) {
            if (fromFeed === "mapTo") {
                _mapping[fromCategory][fromFeed].forEach(function(toCategory) {
                    _addReversedCategory(fromCategory, toCategory);
                });
                continue;
            }
            for (toCategories in _mapping[fromCategory][fromFeed]) {
                toFeed = _mapping[fromCategory][fromFeed][toCategories];
                toCategoriesArray = toCategories.split(',');

                toCategoriesArray.forEach(function(toCategory) {
                    _addMapping(toCategory, toFeed, fromCategory, fromFeed);
                });
            }
        }
    }
    
    AliasMapping.aliasExisted = function(fromCategory, toCategory) {
        if (!fromCategory || !toCategory) {
            return false;
        }
        var mapTo = _mapping[fromCategory] ? _mapping[fromCategory].mapTo || [] : [];
        return mapTo.indexOf(toCategory) === -1 ? false : true;
    }; 

    var _map = function (fromCategory, toCategory, fromType, toType, fromFeedItems, toFeedItems, defType, remainings) {
        var fromIds = Object.keys(_mapping[fromCategory]);
        var measureNames = FeedUtil.getMNDEnumeration(toType);

        fromFeedItems.forEach(function (fromFeed) {
            if (BindingDefUtils.get(fromType, fromFeed.id).type() !== defType) {
                return;
            }
            var hasMap = false;
            if (fromIds.indexOf(fromFeed.id) !== -1) {
                var fromId = fromFeed.id;
                var id = _findId(_mapping[fromCategory][fromId], toCategory);
                if (id) {
                    hasMap = true;
                    var values = fromFeed.values;
                    if (values) {
                        var newFeed = {
                            'id' : id,
                            'values' : []
                        };
                        toFeedItems.push(newFeed);
                        values.forEach(function (ao) {
                            //delete measureNames, otherwise the MNDvalidate will be incorrect when using new chart tyoe.
                            if (ao.type === FeedConst.TYPE_MND && ao.measureNames) {
                                delete ao.measureNames;
                            }
                            if (FeedService.switchable(toType, toFeedItems, newFeed.id, ao)) {
                                newFeed.values.push(ao);
                            } else {
                                remainings && remainings.push(ao);
                            }
                        });
                    }
                }
            }
            if (!hasMap && remainings && fromFeed.values) {
                //All the values of fromFeed will be push into remainings
                fromFeed.values.forEach(function (v) {
                    remainings.push(v);
                });
            }
        });
        return toFeedItems;
    };

    AliasMapping.map = function(fromCategory, toCategory, fromType, toType, fromFeedItems, remainings) {
        if (!fromCategory || !toCategory) {
            return [];
        }
        var toFeedItems = [];
        //Map measure before dimension to avoid incorrect check in MNDValidator
        toFeedItems = _map(fromCategory, toCategory, fromType, toType, fromFeedItems, toFeedItems, BindingDefConst.TYPE_MEASURE, remainings);
        toFeedItems = _map(fromCategory, toCategory, fromType, toType, fromFeedItems, toFeedItems, BindingDefConst.TYPE_DIMENSION, remainings);
        return toFeedItems;
    };

    var _findId = function(categoriesGroupMap, category) {
        for (var group in categoriesGroupMap) {
            if (group.split(',').indexOf(category) !== -1) {
                return categoriesGroupMap[group];
            }
        }
        return null;
    };

    return AliasMapping;
});

// @formatter:off
define('sap/viz/vizservices/service/bvr/switch/ChartCategories',[], function() {
// @formatter:on
    var ChartCategories = {};
    
    var _categories = {
        "XY" : [
            "info/bar", 
            "info/column", 
            "info/stacked_bar", 
            "info/stacked_column", 
            "info/100_stacked_bar", 
            "info/100_stacked_column", 
            "info/line", 
            "info/horizontal_line", 
            "info/combination", 
            "info/horizontal_combination", 
            "info/area", 
            "info/horizontal_area",
            "info/100_area", 
            "info/100_horizontal_area",
            "info/mekko", 
            "info/100_mekko", 
            "info/horizontal_mekko", 
            "info/100_horizontal_mekko",
            "info/trellis_bar", 
            "info/trellis_column", 
            "info/trellis_stacked_bar", 
            "info/trellis_stacked_column", 
            "info/trellis_100_stacked_bar", 
            "info/trellis_100_stacked_column", 
            "info/trellis_line", 
            "info/trellis_horizontal_line", 
            "info/trellis_combination", 
            "info/trellis_horizontal_combination",
            "info/trellis_area", 
            "info/trellis_horizontal_area",
            "info/trellis_100_area", 
            "info/trellis_100_horizontal_area"
        ],
        "XYY" : [
            "info/dual_bar", 
            "info/dual_column", 
            "info/dual_line", 
            "info/dual_horizontal_line", 
            "info/dual_combination", 
            "info/dual_horizontal_combination", 
            "info/dual_stacked_combination", 
            "info/dual_horizontal_stacked_combination",
            "info/trellis_dual_bar", 
            "info/trellis_dual_column", 
            "info/trellis_dual_line", 
            "info/trellis_dual_horizontal_line"
        ],
        "Bubble" : ["info/bubble", "info/trellis_bubble"],
        "Pie" : ["info/pie", "info/donut", "info/trellis_donut", "info/trellis_pie"],
        "Scatter" : ["info/scatter", "info/trellis_scatter"],
        "Bullet" : ["info/bullet", "info/vertical_bullet"],
        "TreeMap" : ["info/treemap"],
        "HeatMap" : ["info/heatmap"],
        "TagCloud" : ["info/tagcloud"],
        "TimeLine" : ["info/timeseries_line"],
        "TimeScatter" : ["info/timeseries_scatter", "info/timeseries_bubble"],
        "TimeCombination" : ["info/timeseries_combination","info/dual_timeseries_combination"],
        "Numeric" : ["info/number"],
        "Radar" : ["info/radar", "info/trellis_radar"],
        "Waterfall" : ["info/waterfall", "info/horizontal_waterfall"],
        "StackedWaterfall" : ["info/stacked_waterfall", "info/horizontal_stacked_waterfall"],
        "HichertVariance" : ["info/hichert_column", "info/hichert_bar"]
    }; 

    
    ChartCategories.findCategory = function(type) {
        for (var key in _categories) {
            if (_categories.hasOwnProperty(key)) {
                if (_categories[key].indexOf(type) >= 0) {
                    return key;
                }
            }
        }
    };
    return ChartCategories;
});

// @formatter:off
define('sap/viz/vizservices/service/bvr/switch/NameMapping',[
    'sap/viz/vizservices/common/feed/FeedUtil',
    'sap/viz/vizservices/service/feed/FeedService',
    'sap/viz/vizservices/common/feed/FeedConst',
    'sap/viz/vizservices/common/metadata/bindingdef/BindingDefUtils',
    'sap/viz/vizservices/common/metadata/bindingdef/BindingDefConst',
    'sap/viz/vizservices/common/metadata/MetadataFactory'
], function(
    FeedUtil,
    FeedService,
    FeedConst,
    BindingDefUtils,
    BindingDefConst,
    MetadataFactory
) {
// @formatter:on
    var NameMapping = {};
    
    var _map = function(fromType, toType, fromFeedItems, toFeedItems, defType, remainings) {
        var temp = FeedUtil.buildEmptyFeeds(toType);
        fromFeedItems.forEach(function(fromFeed) {
            if (BindingDefUtils.get(fromType, fromFeed.id).type() !== defType) {
                return;
            }
            var hasMap = false;
            temp.forEach(function(toFeed) {
                if (fromFeed.id == toFeed.id) {
                    hasMap = true;
                    var values = fromFeed.values;
                    if (values) {
                        var newFeed = {
                            'id': fromFeed.id,
                            'values': []
                        };
                        toFeedItems.push(newFeed);
                        values.forEach(function(ao) {
                            if (ao.type === FeedConst.TYPE_MND && ao.measureNames) {
                                delete ao.measureNames;
                            }
                            if (FeedService.switchable(toType, toFeedItems, newFeed.id, ao)) {
                                newFeed.values.push(ao);
                            } else {
                                remainings && remainings.push(ao);
                            }
                        });
                    }
                }
            });
            if (!hasMap && remainings && fromFeed.values) {
                //All the values of fromFeed will be push into remainings
                fromFeed.values.forEach(function (v) {
                    remainings.push(v);
                });
            }
        });
        return toFeedItems;
    };

    NameMapping.map = function(fromType, toType, fromFeedItems, remainings) {
        var toFeedItems = [];
        toFeedItems = _map(fromType, toType, fromFeedItems, toFeedItems, BindingDefConst.TYPE_MEASURE, remainings);
        toFeedItems = _map(fromType, toType, fromFeedItems, toFeedItems, BindingDefConst.TYPE_DIMENSION, remainings);
        return toFeedItems;
    };

    return NameMapping;
});

define("sap/viz/vizservices/common/LanguageLoader", [], function() {
    sap.viz.extapi.env.Language.register({id:'language',value: {VIZ_SERVICES_INVALID_PARAMETER:"Invalid Parameter.",}});
});

// @formatter:off
define('sap/viz/vizservices/service/bvr/BVRService',[
    'sap/viz/vizservices/common/feed/FeedUtil',
    'sap/viz/vizservices/common/metadata/bindingdef/BindingDefUtils',
    'sap/viz/vizservices/common/feed/FeedConst',
    'sap/viz/vizservices/service/bvr/feeders/MNDFeeder',
    'sap/viz/vizservices/service/bvr/feeders/TimeFeeder',
    'sap/viz/vizservices/service/bvr/feeders/CommonFeeder',
    'sap/viz/vizservices/service/bvr/switch/AliasMapping',
    'sap/viz/vizservices/service/bvr/switch/ChartCategories',
    'sap/viz/vizservices/service/bvr/switch/NameMapping',
    'sap/viz/vizservices/common/utils/Utils',
    'sap/viz/vizservices/common/metadata/MetadataFactory',
    'sap/viz/vizservices/common/LanguageLoader',
    'sap/viz/vizservices/service/feed/FeedService',
    'exports'
], function(
    FeedUtil,
    BindingDefUtils,
    FeedConst,
    MNDFeeder,
    TimeFeeder,
    CommonFeeder,
    AliasMapping,
    ChartCategories,
    NameMapping,
    utils,
    MetadataFactory,
    LanguageLoader,
    FeedService
    ) {
// @formatter:on
    // window.sap.viz.vizservices.service.BVRService
    /**
     * The BVRService recommend the best visualization by provided conditions of type, feedItems, etc.
     */
    var BVRService = {};

    BVRService.switchFeeds = function(fromType, fromFeedItems, toType, options) {
        // parameter handle
        // if there is error in parameters throw error
        var expectArguments = [{
            typeValidator : utils.isString
        }, {
            typeValidator : FeedUtil.isArrayOfFeedItem
        }, {
            typeValidator : utils.isString
        }];

        if (!utils.checkArgs(arguments, expectArguments) || 
            MetadataFactory.get(fromType) === null || 
            MetadataFactory.get(toType) === null) {
            throw utils.substitute(sap.viz.extapi.env.Language.getResourceString('VIZ_SERVICES_INVALID_PARAMETER'));
        }
        fromFeedItems = FeedUtil.removeInvalid(fromType, fromFeedItems);
        var fromDefs = MetadataFactory.get(fromType).getBindingDefsWithBVRSorting();
        var sortedFromFeeds = fromDefs.map(function (def) {
            return FeedUtil.getFeed(fromFeedItems, def.id());
        }).filter(function (feed) {
            return !!feed;
        });

        // Mapping
        var result = FeedUtil.buildEmptyFeeds(toType);
        var fromCategory = ChartCategories.findCategory(fromType);
        var toCategory = ChartCategories.findCategory(toType);
        var remainings = [];
        if (fromCategory && toCategory && AliasMapping.aliasExisted(fromCategory, toCategory)) {
            result = FeedUtil.merge(result, AliasMapping.map(fromCategory, toCategory, fromType, toType, sortedFromFeeds, remainings));
        } else {
            //For extension chart
            result = FeedUtil.merge(result, NameMapping.map(fromType, toType, sortedFromFeeds, remainings));
        }

        // copy remaining to record the analysisObjects that will be reordered
        var aosToBeReordered = remainings.slice(0);

        // Balance
        var exclude = [];
        exclude.push("dataFrame");

        var suggestOptionalFeed = !options || (options.suggestOptionalFeed !== false); // default is true
        var scope = generateScope(toType, exclude, suggestOptionalFeed);
        result = suggestFeeds(toType, result, remainings, scope).feedItems;

        if (fromType !== toType) {
            result = _balance(toType, result, aosToBeReordered);
        }

        // Reorder
        // The analysisObjects that can not be mapped and those being balanced to another feeds will be reordered 
        
        var sortedAosToBeReordered = [];
        sortedFromFeeds.forEach(function (feedItem) {
            feedItem && feedItem.values && feedItem.values.forEach(function (ao) {
                if (ao.type !== FeedConst.TYPE_MND && aosToBeReordered.indexOf(ao) !== -1) {
                    sortedAosToBeReordered.push(ao);
                }
            })
        });

        _reorder(toType, result, sortedAosToBeReordered);
        // feed mnd if missing MND only.
        var results = {
            "type": toType,
            "feedItems": result
        };
        if ((!options || options.considerMND !== false) && isMissingMNDOnly(results)) {
            result = suggestFeeds(results.type, results.feedItems, [{
                "id": FeedConst.ID_MND,
                "type": FeedConst.TYPE_MND,
                "measureNames": FeedUtil.getMNDEnumeration(results.type)
            }], scope).feedItems;
        }

        return {
            'type' : toType,
            'feedItems' : result
        };
    };

    BVRService.suggestFeeds = function(type, feedItems, analysisObjects, options) {
        // parameter handle
        // if there is error in parameters throw error
        var expectArguments = [{
            typeValidator : utils.isString
        }, {
            typeValidator : FeedUtil.isArrayOfFeedItem
        }, {
            typeValidator : FeedUtil.isArrayOfAnalysisObject
        }, {
            typeValidator : utils.isObject,
            isOptional : true
        }];
        if (!utils.checkArgs(arguments, expectArguments) || 
            MetadataFactory.get(type) === null) {
            throw utils.substitute(sap.viz.extapi.env.Language.getResourceString('VIZ_SERVICES_INVALID_PARAMETER'));
        }
        // ignore the invalid feeds
        feedItems = FeedUtil.removeInvalid(type, feedItems);
        var emptyFeeds = FeedUtil.buildEmptyFeeds(type);

        feedItems = FeedUtil.merge(emptyFeeds, feedItems);
        feedItems = FeedUtil.cloneFeeds(feedItems);
        var exclude = [];
        exclude.push("dataFrame");

        var suggestOptionalFeed = !options || (options.suggestOptionalFeed !== false);
        var scope = generateScope(type, exclude, suggestOptionalFeed);
        
        var copiedAnalysisObjects = analysisObjects.slice(0);

        var result = suggestFeeds(type, feedItems, analysisObjects, scope);

        //MND will not be reordered
        var mndIndex = FeedUtil.indexOfMNDInValues(copiedAnalysisObjects);
        if (mndIndex !== -1) {
            copiedAnalysisObjects.splice(mndIndex, 1);
        }
        _reorder(type, feedItems, copiedAnalysisObjects);

        // the default value of considerMND is true.
        if ((!options || options.considerMND !== false) && isMissingMNDOnly(result)) {
            result = suggestFeeds(result.type, result.feedItems, [{
                "id" : FeedConst.ID_MND,
                "type" : FeedConst.TYPE_MND,
                "measureNames" : FeedUtil.getMNDEnumeration(type)
            }], scope);
        }

        return result;
    };

    var isMissingMNDOnly = function(result) {
        var validationResult = FeedService.validate(result.type, result.feedItems);
        
        if (!validationResult.valid) {
            var missingCount = 0;
            var missingList = [];
            var allowMND = false;
            
            var bindings = validationResult.results.bindings;
            for (var i in bindings) {
                if (bindings[i].missing) {
                    // count trellisMissing as one
                    if (!bindings[i].associate || missingList.indexOf(bindings[i].associate) < 0) {
                        missingList.push(i);
                        missingCount += bindings[i].missing;
                    }
                } else if (bindings[i].allowMND) {
                    allowMND = true;
                }
            }
            // when allowMND is true
            // missingCount is 1, missing one dimension and this dimension can accept mnd
            // missingCount is 0 and allowMND is true, means only missing MND
            if ((allowMND && missingCount === 0) || (missingCount === 1 && bindings[missingList[0]].allowMND)) {
                return true;
            }
        }
        return false;
    }; 


    var suggestFeeds = function(type, feedItems, analysisObjects, scope) {
        // Remove feedItems out of scope
        var inScopeFeedItems;
        if (scope && scope.length) {
            inScopeFeedItems = [];
            feedItems.forEach(function(feed) {
                if (scope.indexOf(feed.id) !== -1) {
                    inScopeFeedItems.push(feed);
                }
            });
        } else {
            inScopeFeedItems = feedItems;
        }
        // Auto feeding
        _autoFeeding(type, feedItems, analysisObjects.slice(0), inScopeFeedItems);

        return {
            'type' : type,
            'feedItems' : feedItems
        };
    };
    
    var generateScope = function(type, exclude, includeOptinalFeed) {
        includeOptinalFeed = includeOptinalFeed !== false;
        var bindingDefs = MetadataFactory.get(type).getBindingDefs();
        return bindingDefs.filter(function (def) {
            var isExclude = exclude.indexOf(def.id()) !== -1;
            var isOptionalFeed = !def.min() && def.id() !== FeedConst.ID_TRELLIS_ROW && def.id() !== FeedConst.ID_TRELLIS_COLUMN;
            return !isExclude && (includeOptinalFeed || !isOptionalFeed);
        }).map(function (def) {
            return def.id();
        });
    };

    var _autoFeeding = function(type, feedItems, remainings, inScopeFeedItems) {
        inScopeFeedItems = inScopeFeedItems || feedItems;

        TimeFeeder.feed(type, inScopeFeedItems, remainings);

        var mndIndex = FeedUtil.indexOfMNDInValues(remainings);
        if (mndIndex === -1) {
            CommonFeeder.feed(type, feedItems, remainings, inScopeFeedItems);
        } else {
            var beforeMnd = remainings;
            remainings = remainings.splice(mndIndex);
            var afterMnd = remainings.splice(1);
            var mnds = remainings;
            
            CommonFeeder.feed(type, feedItems, beforeMnd, inScopeFeedItems);
            MNDFeeder.feed(type, inScopeFeedItems, mnds);
            CommonFeeder.feed(type, feedItems, afterMnd, inScopeFeedItems);
        }
        
    };


    /**
     * Reorder added AnalysisObjects for feedItems
     *
     * @param visualizationType
     * @param {Array<FeedItem>} feeds
     *          An array of feedItems whose analysisObjects will be reordered
     * @param {Array<AnalysisObject>} allAnalysisObjects
     *          An array of all analysisObjects in the pool
     *
     * @private
     */
    var _reorder = function(visualizationType, feeds, allAnalysisObjects) {
        //addAos record all new analysisObjects added to feeds
        //aoIndexMap record the indexs of all added analysisObjects
        var addAos = [], aoIndexMap = {};
        //loop through all analysisObjects of feeds
        feeds.forEach(function(feed){
            //Initial for aoIndexMap of feed.id
            aoIndexMap[feed.id] = [];
            feed.values.forEach(function(ao, aoIndex){
                if (allAnalysisObjects.indexOf(ao) !== -1){
                    addAos.push(ao);
                    aoIndexMap[feed.id].push(aoIndex);
                }
            });
        });

        //reorder addAos base on the sequence of allAnalysisObjects
        var tempAos = [];
        allAnalysisObjects.forEach(function(ao){
            if (addAos.indexOf(ao) !== -1){
                tempAos.push(ao);
            }
        });
        addAos = tempAos;

        var i, currentAo, currentFeed;
        //Reorder analysisObjects with the same ID
        for (i = 0; i < addAos.length; i++){
            currentAo = addAos[i];
            currentFeed = _findFeed(feeds, currentAo);
            _loopThroughAddedAos(visualizationType, feeds, aoIndexMap, function(feed, aoToBeSwitch){
                if (aoToBeSwitch === currentAo){
                    return true;
                }
                if (aoToBeSwitch.id == currentAo.id && aoToBeSwitch !== currentAo && addAos.indexOf(aoToBeSwitch) > i ){
                    //switch
                    _switchAo(currentFeed, currentAo, feed, aoToBeSwitch);
                    return true;
                }
            });
        }
        //Reorder
        for (i = 0; i < addAos.length; i++){
            currentAo = addAos[i];
            currentFeed = _findFeed(feeds, currentAo);
            _loopThroughAddedAos(visualizationType, feeds, aoIndexMap, function(feed, aoToBeSwitch){
                if (aoToBeSwitch === currentAo){
                        return true;
                }
                var validateResult = _validateTypeAndDuplicate(visualizationType, feed, currentAo) && _validateTypeAndDuplicate(visualizationType, currentFeed, aoToBeSwitch);
                if ((feed.id === currentFeed.id || validateResult) && addAos.indexOf(aoToBeSwitch) > i){
                    _switchAo(currentFeed, currentAo, feed, aoToBeSwitch);
                    return true;
                }
            });
        }
    };

    /**
     * Loop Through All Added AnalysisObjects of FeedItems base of bvrPriority
     * @param visualizationType
     * @param {Array<FeedItems>} feeds
     * @param {Object} aoIndexMap
     *          A map indicate the indexs of added analysisObjects of feedItem
     *          e.g. {'valueAxis':[1,2]} means that the index 1 and 2 analysisObjects
                    of valueAxis is new added analysisObjects
     * @param {function(FeedItem, AnalysisObject)} func
     *          CallBack Function, return YES if stop loop
     * @private
     */
    var _loopThroughAddedAos = function(visualizationType, feeds, aoIndexMap, func){
        // Get binding defs
        var defs = MetadataFactory.get(visualizationType).getBindingDefsWithBVRSorting();

        //Loop
        for (var j = 0; j < defs.length; j++){
            var def = defs[j], feed = FeedUtil.getFeed(feeds, def.id());
            if (feed == null) { continue; }
            var fIsToBreak = false;

            var indexes = aoIndexMap[feed.id] || [];
            for (var k = 0; k <indexes.length; k++) {
                var aoIndex = indexes[k];
                var aoToBeSwitch = feed.values[aoIndex];
                var fRet = func(feed, aoToBeSwitch);
                if (fRet){
                    return;
                }
            }
        }
    };

    /**
     * Switch analysisObjects of two feedItems
     * @param {FeedItem} feed1
     * @param {AnalysisObject} ao1
     * @param {FeedItem} feed2
     * @param {AnalysisObject} ao2
     * @private
     */
    var _switchAo = function(feed1, ao1, feed2, ao2){
        var iIndex1 = feed1.values.indexOf(ao1);
        var iIndex2 = feed2.values.indexOf(ao2);
        if (iIndex1 != -1 && iIndex2 != -1){
            var tempAo = feed1.values[iIndex1];
            feed1.values[iIndex1] = feed2.values[iIndex2];
            feed2.values[iIndex2] = tempAo;
        }
    };

    var _validateTypeAndDuplicate = function(type, feed, analysisObject) {
        if (!BindingDefUtils.support(BindingDefUtils.get(type, feed.id), analysisObject)) {
            return false;
        }
        var feedAos = feed.values;
        for (var i = 0; i < feedAos.length; i++) {
            var tempAo = feedAos[i];
            if (tempAo.id == analysisObject.id) {
                return false;
            }
        }
        return true;
    };

    var _findFeed = function(feeds, analysisObject) {
        var tempFeedIndex;
        for (tempFeedIndex in feeds) {
            if (feeds[tempFeedIndex].values.indexOf(analysisObject) != -1) {
                return feeds[tempFeedIndex];
            }
        }
        return null;
    };


    // balance analysisObjects if there some feedItems that can not meet the min or trellis requirement
    // The adjusted analysisObjects will be add to remainings if passed
    var _balance = function(visualizationType, feeds, remainings) {
        // Handle trellis chart, when the visualizationType is trellis and no feedItem in trellisRow or trellisCulumn
        // balance to the trellisRow
        var balanceTrellis = false;
        var row = FeedUtil.getFeed(feeds, FeedConst.ID_TRELLIS_ROW),
            column = FeedUtil.getFeed(feeds, FeedConst.ID_TRELLIS_COLUMN);
        if (row && column && row.values.length === 0 && column.values.length === 0) {
            balanceTrellis = true;
        }

        // Get binding defs
        var defs = MetadataFactory.get(visualizationType).getBindingDefsWithBVRSorting();
        for (var i = 0; i < defs.length; i++) {
            var def = defs[i], feed = FeedUtil.getFeed(feeds, def.id());
            var isNeedToFeed = (feed.values.length < def.min() || (balanceTrellis && feed === row && !feed.values.length));
            for (var j = 0; isNeedToFeed && j < defs.length; j++) {
                var otherDef = defs[j];

                var otherFeed = FeedUtil.getFeed(feeds, otherDef.id());

                if (BindingDefUtils.get(visualizationType, feed.id).type() != BindingDefUtils.get(visualizationType, otherFeed.id).type()) {
                    continue;
                }

                var k = otherFeed.values.length - 1;
                //Other Def should at least have one analysisObj
                var otherDefMin = otherDef.min() > 1 ? otherDef.min() : 1;

                //Balance will not handle DataFrame
                while (k >= 0 && feed.id !== FeedConst.ID_DATAFRAME && isNeedToFeed && otherFeed.values.length > otherDefMin) {
                    var otherAo = otherFeed.values.splice(k,1)[0];
                    //Ignore MND
                    if (otherAo.type !== FeedConst.TYPE_MND && FeedService.addable(visualizationType, feeds, feed.id, otherAo)) {
                        feed.values.push(otherAo);
                        remainings && remainings.push(otherAo);
                    } else {
                        otherFeed.values.splice(k, 0, otherAo);
                    }
                    k--;
                    isNeedToFeed = (feed.values.length < def.min() || (balanceTrellis && feed === row && !feed.values.length));
                }
            }
        }
        return feeds;
    };



    return BVRService;
});

// @formatter:off
define('sap/viz/vizservices/api/BVRService',[
    'sap/viz/vizservices/service/bvr/BVRService',
    'require'
], function(BVRService) {
// @formatter:on

    /**
     * The BVRService recommend the best visualization by provided conditions of vizType, feedItems, etc.
     * BVRService provides auto-binding functionality for info Charts.
     * @namespace sap.viz.vizservices.BVRService
     */
    var BVRServiceAPI = sap.viz.vizservices.BVRService = {};

    /**
     * Suggest new feeds when new analysis objects are added to existing viz and feeds.<br />
     * If adding a MND can create a meaningful chart, add MND to the recommended feed automatically.<br />
     * @memberOf sap.viz.vizservices.BVRService
     * @function suggestFeeds
     * @param {String} type
     * @param {Array<FeedItem>} feedItems
     * FeedItem: JSON data structure with id and values. <br />
     * FeedItem.id is a string which indicate the feed id.<br />
     * FeedItem.values is an array of AnalysisObject. values indicate the Dimensions or Measures which fed on the feed id.<br />
     * @param {Array<AnalysisObject>} analysisObjects
     * AnalysisObject: JSON data structure with id, type and dataType.<br />
     * AnalysisObject.id is a string which indicate the analysis object id.<br />
     * AnalysisObject.type is a string which indicate the analysis object type. Available values are: Dimension, Measure, MND.<br />
     * AnalysisObject.dataType is a string which indicate the analysis object data type. Available values are: String, Number, Date.<br />
     * @param {JSON} options
     * contains some flags, this param is optional.<br />
     * suggestOptionalFeed: whether to feed  optional feeds like waterfallType in Waterfall., the default value is true.<br />
     * <br/ >
     * @return {Object<String, Array<FeedItem>>} Object with type and feedItems.
     * <br/ >
     * @example <caption>Sample Code:</caption>
     * //1. When invoke suggestFeeds with parameters for bar chart.
     * //SuggestFeeds will suggest dim_0 and dim_1 to categoryAxis, dim_2 to color.
     * //Result will be
     * //{
     * //  "type":"info/bar",
     * //  "feedItems":[
     * //       {"id":"dataFrame","values":[]},
     * //       {"id":"categoryAxis","values":[
     * //           {"id":"dim_0","type":"Dimension","dataType":"String"},
     * //           {"id":"dim_1","type":"Dimension","dataType":"String"}
     * //       ]},
     * //       {"id":"color","values":[
     * //           {"id":"dim_2","type":"Dimension","dataType":"String"}
     * //       ]},
     * //       {"id":"valueAxis","values":[]}
     * //   ]
     * //}
     * var type = "info/bar";
     * var feedItems = [];
     * var analysisObjects = [
     *     {"id":"dim_0", "type":"Dimension", "dataType":"String"},
     *     {"id":"dim_1", "type":"Dimension", "dataType":"String"},
     *     {"id":"dim_2", "type":"Dimension", "dataType":"String"}
     * ];
     * BVRService.suggestFeeds(type, feedItems, analysisObjects);
     * 
     * 
     * //2.When adding a MND can create a meaningful chart, add a MND in dimension.
     * 
     * //Example 1:
     * //Result will be
     * //{
     * //  "type":"info/column",
     * //  "feedItems":[
     * //       {"id":"dataFrame","values":[]},
     * //       {"id":"categoryAxis","values":[
     * //           {"id":"MND","type":"MND","measureNames":["valueAxis"]}
     * //       ]},
     * //       {"id":"color","values":[]},
     * //       {"id":"valueAxis","values":[
     * //           {"id":"mea_1","type":"Measure","dataType":"Number"},
     * //           {"id":"mea_2","type":"Measure","dataType":"Number"}
     * //       ]}
     * //   ]
     * //}
     * var type = "info/column";
     * var feedItems = [];
     * var analysisObjects = [
     * {"id":"mea_1", "type":"Measure", "dataType":"Number"},
     * {"id":"mea_2", "type":"Measure", "dataType":"Number"}
     * ];
     * BVRService.suggestFeeds(type, feedItems, analysisObjects);
     * 
     * //Example 2:
     * //Result will be
     * //{
     * //  "type":"info/column",
     * //  "feedItems":[
     * //       {"id":"dataFrame","values":[]},
     * //       {"id":"categoryAxis","values":[
     * //           {"id":"dim_0","type":"Dimension","dataType":"String"},
     * //           {"id":"dim_1","type":"Dimension","dataType":"String"}
     * //       ]},
     * //       {"id":"color","values":[
     * //           {"id":"dim_2","type":"Dimension","dataType":"String"},
     * //           {"id":"MND","type":"MND","measureNames":["valueAxis"]}
     * //       ]},
     * //       {"id":"valueAxis","values":[
     * //           {"id":"mea_1","type":"Measure","dataType":"Number"},
     * //           {"id":"mea_2","type":"Measure","dataType":"Number"}
     * //       ]}
     * //   ]
     * //}
     * var type = "info/column";
     * var feedItems = [];
     * var analysisObjects = [
     * {"id":"dim_0", "type":"Dimension", "dataType":"String"},
     * {"id":"dim_1", "type":"Dimension", "dataType":"String"},
     * {"id":"dim_2", "type":"Dimension", "dataType":"String"},
     * {"id":"mea_1", "type":"Measure", "dataType":"Number"},
     * {"id":"mea_2", "type":"Measure", "dataType":"Number"}
     * ];
     * BVRService.suggestFeeds(type, feedItems, analysisObjects);
     */
    BVRServiceAPI.suggestFeeds = function(type, feedItems, analysisObjects, options) {
        return BVRService.suggestFeeds(type, feedItems, analysisObjects, options);
    };

    /**
     * Switch to new feeds by existing feeds after type changed.<br/ >
     * Change the feeds for corresponding chart type. <br/ >
     * If adding a MND can create a meaningful chart, add MND to the recommended feed automatically. <br/ >
     * @memberOf sap.viz.vizservices.BVRService
     * @function switchFeeds
     * @param {String} fromType
     * @param {Array<FeedItem>} fromFeeds
     * FeedItem: JSON data structure with id and values. <br />
     * FeedItem.id is a string which indicate the feed id.<br />
     * FeedItem.values is an array of AnalysisObject. values indicate the Dimensions or Measures which fed on the feed id.<br />
     * @param {String} toType
     * @param {JSON} options
     * contains some flags, this param is optional.<br />
     * suggestOptionalFeed: whether to feed  optional feeds like waterfallType in Waterfall., the default value is true.<br />
     * <br/ >
     * @return {Object<String, Array<FeedItem>>} Object with toType and feeds.
     * <br/ >
     * @example <caption>Sample Code:</caption>
     * //1. When invoke switchFeeds with parameters, if chart type switched to pie chart.
     * //SwitchFeeds will switch mea_0  to size, and dim_0 to color.
     * //Result will be
     * //{
     * //  "type":"info/pie",
     * //  "feedItems":[
     * //       {"id":"dataFrame","values":[]},
     * //       {"id":"size","values":[
     * //           {"id":"mea_0","type":"Measure"}
     * //       ]},
     * //       {"id":"color","values":[
     * //           {"id":"dim_0","type":"Dimension"}
     * //       ]}
     * //   ]
     * //}
     * var fromType = "info/bar";
     * var fromFeedItems = [
     *     {"id":"valueAxis","values":[{"id":"mea_0","type":"Measure"}]},
     *     {"id":"categoryAxis","values":[{"id":"dim_0","type":"Dimension"}]}
     * ];
     * var toType = "info/pie";
     * BVRService.switchFeeds(fromType, fromFeedItems, toType); 
     * 
     * 
     * //2. When invoke switchFeeds with parameters, if chart type switched to column chart.
     * //SwitchFeeds will switch mea_0 to valueAxis, and dim_0 to categoryAxis.
     * //Result will be
     * //{
     * //  "type":"info/column",
     * //  "feedItems":[
     * //      {"id":"dataFrame","values":[]},
     * //      {"id":"categoryAxis","values":[
     * //          {"id":"dim_0","type":"Dimension"}
     * //      ]},
     * //      {"id":"color","values":[]},
     * //      {"id":"valueAxis","values":[
     * //          {"id":"mea_0","type":"Measure"}
     * //      ]}
     * //   ]
     * //}
     * var fromType = "info/pie";
     * var fromFeedItems = [
     *      {"id":"size","values":[{"id":"mea_0","type":"Measure"}]},
     *      {"id":"color","values":[{"id":"dim_0","type":"Dimension"}]}
     * ];
     * var toType = "info/column";
     * BVRService.switchFeeds(fromType, fromFeedItems, toType);
     * 
     * //3. When invoke switchFeeds with parameters, if chart type switched from XY to trellis XY chart.
     * //SwitchFeeds will add MND in trellisRow as adding this MND can create a meaningful trellis chart.
     * //Result will be
     * //{
     * //  "type":"info/trellis_bar",
     * //  "feedItems":[
     * //      {"id":"trellisColumn","values":[]},
     * //      {"id":"trellisRow","values":[{"id":"MND","type":"MND","measureNames":["valueAxis"]}]},
     * //      {"id":"categoryAxis","values":[{"id":"dim_0","type":"Dimension"}]},
     * //      {"id":"color","values":[]},
     * //      {"id":"valueAxis","values":[{"id":"mea_0","type":"Measure"}]}
     * //   ]
     * //}
     * var fromType = "info/bar";
     * var fromFeedItems = [
     *      {"id":"valueAxis","values":[{"id":"mea_0","type":"Measure"}]},
     *      {"id":"categoryAxis","values":[{"id":"dim_0","type":"Dimension"}]}
     * ];
     * var toType = "info/trellis_bar";
     * BVRService.switchFeeds(fromType, fromFeedItems, toType);
     */
    BVRServiceAPI.switchFeeds = function(fromType, fromFeedItems, toType, options) {
        return BVRService.switchFeeds(fromType, fromFeedItems, toType, options);
    };
    
    return BVRServiceAPI;
});

define('sap/viz/vizservices/common/Version',[],function() {
    /** sap.viz.vizservices.VERSION
     */

    /**
     * Constant, the current version of sap.viz.vizservices.
     * @static
     * @example
     * var verion = sap.viz.vizservices.VERSION;
     */
    return '1.9.1';
});

// @formatter:off
define('sap/viz/vizservices/api/Version',[
    'sap/viz/vizservices/common/Version',
    'require'
], function(Version) {
// @formatter:on
    /** sap.viz.vizservices.VERSION
     * @namespace sap.viz.vizservices.VERSION
     */
    sap.viz.vizservices.VERSION = Version;
    return Version;

    /**
     * Constant, the current version of sap.viz.vizservices.
     * @member VERSION
     * @memberof sap.viz.vizservices.VERSION
     * @static
     * @example
     * var version = sap.viz.vizservices.VERSION;
     */
});

define('sap/viz/vizservices/common/binding/generators/BindingGeneratorBase',[
// @formatter:off
    'sap/viz/vizservices/common/metadata/MetadataFactory'
], function(MetadataFactory){
// @formatter:on
    /**
     * BindingGeneratorBase Class
     */
    var BindingGeneratorBase = function(settings) {
        this._visualizationType = settings.visualizationType;
        this._bindingDefs = MetadataFactory.get(settings.visualizationType).getBindingDefs();
    };

    BindingGeneratorBase.prototype.generate = function(feedItems) {

    };

    return BindingGeneratorBase;
});

define('sap/viz/vizservices/common/binding/generators/FTBindingGenerator',[
// @formatter:off
    'sap/viz/vizservices/common/utils/OOUtil',
    'sap/viz/vizservices/common/metadata/bindingdef/BindingDefUtils',
    'sap/viz/vizservices/common/feed/FeedConst',
    'sap/viz/vizservices/common/viz/ChartConst',
    'sap/viz/vizservices/common/binding/generators/BindingGeneratorBase'
], function(OOUtil, BindingDefUtils, FeedConst, ChartConst, BindingGeneratorBase){
// @formatter:on

    var FTBindingGenerator = function(settings) {
        FTBindingGenerator.superclass.constructor.apply(this, arguments);
    };
    OOUtil.extend(FTBindingGenerator, BindingGeneratorBase);

    function collectValueAxisNames(visualizationType, feedItems) {
        return feedItems.reduce(function(list, feedItem) {
            if (feedItem.values.length) {
                var def = BindingDefUtils.get(visualizationType, feedItem.id);
                if (def && def.mndEnumerable()) {
                    list.push(feedItem.id);
                }
            }
            return list;
        }, []);
    }


    FTBindingGenerator.prototype.generate = function(feedItems) {
        var valueAxisNames = collectValueAxisNames(this._visualizationType, feedItems);
        var visualizationType = this._visualizationType;
        var bindings = [];
        feedItems.forEach(function(feed) {
            var values = feed.values || [];
            var list = [];
            if (values.length === 0) {
                return;
            }

            for (var j = 0; j < values.length; j++) {
                var aaObj = values[j];
                if (aaObj.type === FeedConst.TYPE_MND) {
                    list.push({
                        measureNames : valueAxisNames
                    });
                } else {
                    list.push(aaObj.id);
                }
            }
            bindings.push({
                feed : feed.id,
                source : list
            });
        });
        return bindings;
    };

    return FTBindingGenerator;
});

define('sap/viz/vizservices/common/binding/BindingConst',[],function() {
    var BindingConst = {};

    BindingConst.ANALYSIS_AXIS = "analysisAxis";
    BindingConst.MEASURE_VALUES_GROUP = "measureValuesGroup";
    BindingConst.MEASURE_NAMES_DIMENSION= "measureNamesDimension";
    
    return BindingConst;
});

define('sap/viz/vizservices/common/binding/generators/XTBindingGenerator',[
// @formatter:off
    'sap/viz/vizservices/common/utils/OOUtil',
    'sap/viz/vizservices/common/viz/ChartConst',
    'sap/viz/vizservices/common/feed/FeedConst',
    'sap/viz/vizservices/common/metadata/bindingdef/BindingDefConst',
    'sap/viz/vizservices/common/binding/BindingConst',
    'sap/viz/vizservices/common/binding/generators/BindingGeneratorBase',
    'sap/viz/vizservices/common/utils/Utils'
], function(OOUtil, 
    ChartConst, 
    FeedConst, 
    BindingDefConst,
    BindingConst,
    BindingGeneratorBase, 
    Utils
) {
// @formatter:on

    var XTBindingGenerator = function(settings) {
        XTBindingGenerator.superclass.constructor.apply(this, arguments);
    };
    OOUtil.extend(XTBindingGenerator, BindingGeneratorBase);

    XTBindingGenerator.prototype.generate = function(feedItems) {
        var bindingMapping = map(feedItems);
        return genBinding(this._bindingDefs, bindingMapping);
    };

    var map = function(feedItems) {
        var bindingMapping = {};
        feedItems.forEach(function(feedItem) {
            var values = feedItem.values;
            if (values.length === 0) { return; }

            var feedId = feedItem.id.indexOf('multiplier') !== -1 ? feedItem.id.split('.')[0] : feedItem.id;
            bindingMapping[ feedId ] = [];

            for (var i = 0; i < values.length; ++i) {
                var analysis = values[i];
                var objId;
                //if the analysisObj type is MND
                if (analysis.type === FeedConst.TYPE_MND) {
                    objId = ":mnd";
                } else {
                    objId = analysis.id;
                }
                bindingMapping[ feedId ].push(objId);
            }
        });
        return bindingMapping;
    };

    var genBinding = function(bindingDefs, mapping) {
        var binding = [],
            order = [BindingDefConst.TYPE_MEASURE, BindingDefConst.TYPE_DIMENSION],
            measureIndex = 1,
            dimensionIndex = 1;

        bindingDefs = bindingDefs
            .map(function (def) {
                return {
                    id: def.id(),
                    name: def.name(),
                    type: def.type(),
                    min: def.min(),
                    max: def.max(),
                    mndMode: def.mndMode(),
                    bvrPriority: def.bvrPriority(),
                    bvrMNDPriority: def.bvrMNDPriority()
                };
            })
            .sort(function (a, b) {
                if (a.type !== b.type) {
                    return order.indexOf(a.type) - order.indexOf(b.type);
                }
                else {
                    return a.bvrPriority - b.bvrPriority;
                }
            });

        bindingDefs.filter(function (feed) {
            if (feed.type !== BindingDefConst.TYPE_MEASURE) { return true; }

            // deal measure
            var info = mapping[ feed.id ];
            if ( !info ) {
                // not feed
                // binding.push({ feed: feed.id, source: [] });
                return false;
            }

            binding.push({
                feed: feed.id,
                source: [
                    {
                        "type": BindingConst.MEASURE_VALUES_GROUP,
                        "index": measureIndex ++
                    }
                ]
            });
            return false;
        })
        .filter(function (feed) {
            if (feed.type !== BindingDefConst.TYPE_DIMENSION) { return true; }

            // deal dimension
            var info = mapping[ feed.id ];
            if ( !info ) {
                // not feed
                // binding.push({ feed: feed.id, source: [] });
                return false;
            }

            binding.push({
                feed: feed.id,
                source: [
                    {
                        "type": BindingConst.ANALYSIS_AXIS,
                        "index": dimensionIndex ++
                    }
                ]
            });

            if ( info.indexOf(":mnd") > -1) {
                if ( info[0] === ":mnd" ) {
                    binding[ binding.length -1 ].source.unshift({
                        "type": BindingConst.MEASURE_NAMES_DIMENSION
                    });
                }
                else {
                    binding[ binding.length -1 ].source.push({
                        "type": BindingConst.MEASURE_NAMES_DIMENSION
                    });
                }
            }

            return false;
        });

        return binding;
    };

    return XTBindingGenerator;
});

define('sap/viz/vizservices/common/binding/BindingGeneratorFactory',[
// @formatter:off
    'sap/viz/vizservices/common/binding/generators/FTBindingGenerator',
    'sap/viz/vizservices/common/binding/generators/XTBindingGenerator'
], function(FTBindingGenerator, XTBindingGenerator, InfoFeedingGenerator){
// @formatter:on
    var BindingGeneratorFactory = {
        'create' : function(visualizationType, datasetType) {
            var generator;
            var settings = {
                'visualizationType' : visualizationType
            };
            if ("FlatTableDataset" === datasetType) {
                generator = new FTBindingGenerator(settings);
            } else if ("CrossTableDataset" === datasetType) {
                generator = new XTBindingGenerator(settings);
            }
            return generator;
        }
    };

    return BindingGeneratorFactory;
});

// @formatter:off
define('sap/viz/vizservices/service/binding/BindingService',[
    'sap/viz/vizservices/common/binding/BindingGeneratorFactory',
    'exports'
], function(BindingGeneratorFactory) {
// @formatter:on
    // window.sap.viz.vizservices.service.__internal__.BindingService

    var BindingService = {};

    BindingService.generateBindings = function(type, feedItems, datasetType) {
        var generator = BindingGeneratorFactory.create(type, datasetType);
        return generator.generate(feedItems);
    };

    return BindingService;
});

// @formatter:off
define('sap/viz/vizservices/common/viz/VizUtils',[
    'jquery',
    'sap/viz/vizservices/common/metadata/MetadataFactory',
    'sap/viz/vizservices/common/utils/Utils'
],
function(
    $,
    MetadataFactory,
    Utils
) {
// @formatter:on
    var VizUtils = {};

    /**
     * remove invalid properties according to chart type
     * @param {object} srcProperties, (string)type
     * @return (object)valid properties object
     */
    VizUtils.getValidProperties = function(srcProperties, type) {
        var reProperties = Utils.clone(srcProperties);
        MetadataFactory.get(type).removeInvalidProperty(reProperties);
        return reProperties;
    };

    VizUtils.getPropertiesDef = function(vizType){
        var metadata = vizType && MetadataFactory.get(vizType);
        var propDef;
        if (metadata) {
            propDef = metadata.getPropertiesDef();
        }
        return propDef;
    }

    /**
     * VizUtils.mergeProperties = function(vizType, destination, src1, ..., srcN) {
     * merge properties src1, src2 ... srcN of vizType into destination
     * @param {string} vizType  vizType of properties
     * @param {object} destination  target properties to be merged into
     * @return {object} src1, src2 ... srcN  properties to be merged from
     */
    VizUtils.mergeProperties = function(vizType, destination, src) {

        var propDef = VizUtils.getPropertiesDef(vizType);
        destination = destination || {};
        for (var i = 2; i < arguments.length; i++) {
            var srcProp = arguments[i];
            VizUtils._mergePropertiesByDef(propDef, destination, srcProp);
        }
        return destination;
    };

    VizUtils.mergeScales = function(target, scales) {
        target = target || [];
        var added = [];
        var found = false;
        for (var i in scales) {
            found = false;
            for (var j in target)  {
                if (target[j].feed === scales[i].feed) {
                    target[j] = scales[i];
                    found = true;
                    break;
                }
            }
            if (!found) {
                added.push(scales[i]);
            }
        }
        if (added.length > 0) {
            target = target.concat(added);
        }
        return target;
    };

    VizUtils._mergePropertiesByDef = function(definition, destination, source) {
        for (var sourceKey in source) {
            var sourceVal = source[sourceKey];
            var subDef = definition ? definition[sourceKey] : definition;
            if (sourceVal !== undefined) {
                if (subDef === null || !$.isPlainObject(sourceVal)) {
                    destination[sourceKey] = sourceVal;
                } else {
                    var destVal = destination[sourceKey];
                    if (!destVal || !$.isPlainObject(destVal)) {
                        destVal = destination[sourceKey] = {};
                    }
                    VizUtils._mergePropertiesByDef(subDef, destVal, sourceVal);
                }
            }
        }
    };

    return VizUtils;
});

// @formatter:off
define('sap/viz/vizservices/service/property/PropertyService',[
    'sap/viz/vizservices/common/viz/VizUtils',
    'exports'
], function(VizUtils) {
// @formatter:on
    // window.sap.viz.vizservices.service.__internal__.PropertyService

    var PropertyService = {};

    PropertyService.removeInvalid = function(type, properties) {
        return VizUtils.getValidProperties(properties, type);
    };

    PropertyService.mergeProperties = function(type, destinationProperties, srcProperties1, srcProperties2/*, ... srcPropertiesn*/) {
        return VizUtils.mergeProperties.apply(null, arguments);
    };

    PropertyService.getPropertiesDef = VizUtils.getPropertiesDef;

    return PropertyService;
});

// @formatter:off
define('sap/viz/vizservices/service/scale/ScaleService',[
    'sap/viz/vizservices/common/viz/VizUtils',
    'exports'
], function(VizUtils) {
// @formatter:on
    // window.sap.viz.vizservices.service.__internal__.ScaleService

    var ScaleService = {};

    ScaleService.mergeScales = function(type, destinationSclaes, srcSclaes) {
        return VizUtils.mergeScales(destinationSclaes, srcSclaes);
    };
    
    return ScaleService;
});
(function(){
    var list = define && define.__autoLoad;
    if(list && list.length){
        define.__autoLoad = [];
        require(list);
    }
})();

(function (global) {
    // restore global require & define
    global.define = sap.viz.moduleloader.originalDefine;
    global.require = sap.viz.moduleloader.originalRequire;
    global.requirejs = sap.viz.moduleloader.originalRequirejs;
})(this);
});
