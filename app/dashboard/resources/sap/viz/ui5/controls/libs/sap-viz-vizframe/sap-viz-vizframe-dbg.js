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
        context: "lw-vizframe",
        exportMap : {
            'sap/viz/vizframe/frame/VizFrame' : 'sap.viz.vizframe.VizFrame',
            'sap/viz/vizframe/common/Version' : 'sap.viz.vizframe.VERSION'
        }
    });
    global.requirejs = require;
})(this);

define('sap/viz/vizframe/common/Version',['exports'], function() {
    /** sap.viz.vizframe.VERSION
     */

    /**
     * Constant, the current version of sap.viz.vizframe.
     * @static
     * @example
     * var version = sap.viz.vizframe.VERSION;
     */
    return '1.9.1';
});

// @formatter:off
define('sap/viz/vizframe/api/Version',[
    'sap/viz/vizframe/common/Version',
    'require'
], function(Version) {
// @formatter:on
    /** sap.viz.vizframe.VERSION
     * @namespace sap.viz.vizframe.VERSION
     */
    sap.viz.vizframe.VERSION = Version;
    return Version;

    /**
     * Constant, the current version of sap.viz.vizframe.
     * @member VERSION
     * @memberof sap.viz.vizframe.VERSION
     * @static
     * @example
     * var version = sap.viz.vizframe.VERSION;
     */
});

define('sap/viz/vizframe/api/APIUtil',[
    
], function() {

    var wrappingMap = {};
    
    function buildProxyMethods(prototype, internalRefKey, methodNames) {
        methodNames.split(/\s+/).forEach( function (key) {
            prototype[key] = function () {
                return wrap( this[internalRefKey][key].apply( this[internalRefKey], arguments ) );
            };
        } );
    }

    function buildProxyProperty(prototype, internalRefKey, propertyNames) {
        propertyNames.split(/\s+/).forEach( function (key) {
            Object.defineProperty(prototype, key, {
                enumerable: true,
                configurable: true,
                get: function () {
                    return this[internalRefKey][key];
                },
                set: function (val) {
                    return ( this[internalRefKey][key] = val );
                }
            });
        } );
    }
    
    function setWrapping(from, to) {
        wrappingMap[from] = to;
    }

    function wrap(object) {
        if ( object == null ) {
            return object;
        }
        if ( object.__wrapper__ ) {
            return object.__wrapper__;
        }
        if ( object.__className && wrappingMap[ object.__className ] ) {
            return new wrappingMap[ object.__className ]( object );
        }
        return object;
    }

    return {
        buildProxyMethods: buildProxyMethods,
        buildProxyProperty: buildProxyProperty,
        wrap: wrap,
        setWrapping: setWrapping
    };
});

define( "jquery", [], function () { return jQuery; } );

define("sap/viz/vizframe/common/LanguageLoader", [], function() {
    sap.viz.extapi.env.Language.register({id:'language',value: {VIZ_FRAME_CONTROL_LOAD_ERROR:"Failed to load the control object {0}.",VIZ_FRAME_INVALID:"Invalid VizFrame instance.",VIZ_FRAME_DESTORYED:"VizFrame instance was destroyed.",}});
});

define('sap/viz/vizframe/common/utils/OOUtil',[],function() {

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

define('sap/viz/vizframe/common/utils/utils',[],function() {
    var utils = {};

    var hasOwn = Object.prototype.hasOwnProperty;

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
        if (!obj || utils.type(obj) !== "object" || obj.nodeType || (obj && typeof obj === "object" && "setInterval" in obj)) {
            return false;
        }

        // Not own constructor property must be Object
        if (obj.constructor && !hasOwn.call(obj, "constructor") && !hasOwn.call(obj.constructor.prototype, "isPrototypeOf")) {
            return false;
        }

        // Own properties are enumerated firstly, so to speed up,
        // if last one is own, then all properties are own.

        var key;
        for (key in obj) {
        }// jshint ignore:line

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
     * An empty function doing nothing.
     */
    utils.noop = function() {
    };
    
    utils.substitute = function(str, rest) {
        if (!str) { return ''; }

        for (var i = 1; i < arguments.length; i++) {
            str = str.replace(new RegExp("\\{" + (i - 1) + "\\}", "g"), arguments[i]);
        }

        return str;
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
    
    utils.isExist = function(o) {
        if ((typeof (o) === 'undefined') || (o === null)) {
            return false;
        }
        return true;
    };
    return utils;
});

define('sap/viz/vizframe/common/events/Event',[],function() {

    /**
     * sap.viz.vizframe.common.events.Event Class
     *
     * @param {String} type
     *            event type
     * @param {sap.viz.vizframe.common.events.EventDispatcher} target
     *            event target
     * @param {Object|undefined} data
     *            event data
     */
    var Event = function(type, target, data) {
        this.__className = "sap.viz.vizframe.common.events.Event";

        /**
         * {String}
         */
        this._type = type;
        /**
         * {sap.viz.vizframe.common.events.EventDispatcher}
         */
        this._target = target;
        /**
         * {Object}
         */
        this.data = data;
    };
    /**
     * Get event type
     *
     * @returns {String}
     */
    Event.prototype.type = function() {
        return this._type;
    };
    /**
     * Get event target
     *
     * @returns {sap.viz.vizframe.common.events.EventDispatcher}
     */
    Event.prototype.target = function() {
        return this._target;
    };
    return Event;
});

// @formatter:off
define('sap/viz/vizframe/common/events/EventDispatcher',[
    'sap/viz/vizframe/common/utils/utils'
], function(utils) {
// @formatter:on

    /**
     * The EventDispatcher class is the base class for all classes that dispatch events.
     */
    /**
     * EventDispatcher Class
     * we remove the original two properties, because this is Base class;
     * all the properties should be dynamically created during function call
     * of subclass.
     *
     */
    var EventDispatcher = function() {
        this.__className = "sap.viz.vizframe.common.events.EventDispatcher";

        // lazy create the listeners maps
        // this._listeners/*<String Array<{type:type, scope:scope, listener:listener, priority:priority}>>*/ = {};
        /**
         * {Boolean}
         */
        this._enableDispatchEvent = true;
    };

    /**
     * Registers an event listener object with an EventDispatcher object so that the listener receives notification of an
     * event.
     *
     * You can register event listeners on any EventDispatcher object for a specific type of event, scope, and
     * priority. If you no longer need an event listener, remove it by calling removeEventListener(), or memory problems
     * could result.
     *
     * @method sap.viz.vizframe.common.events.EventDispatcher.prototype.addEventListener
     *
     * @param {String} type
     *            The type of event.
     * @param {Function} listener
     *            The listener function that processes the event.
     * @param {Object} scope
     *            The scope.
     * @param {int} priority
     *            The priority level of the event listener.
     */
    EventDispatcher.prototype.addEventListener = function(type, listener, scope, priority) {
        // default priority is 0 if priority is not assigned or null.
        if (!priority) {
            priority = 0;
        }

        var eventListener = this._findEventListener(type, listener, scope);
        if (eventListener) {
            // already exists
            return;
        }
        eventListener = {
            type : type,
            scope : scope,
            listener : listener,
            priority : priority
        };

        var listeners = this.listeners()[type];
        if (!listeners) {
            this.listeners()[type] = listeners = [eventListener];
        } else {
            // insert the eventListener at correct position according to its priority
            var isAdded = false;
            for (var n = 0; n < listeners.length; ++n) {
                var temp = listeners[n];
                if (priority > temp.priority) {
                    listeners.splice(n, 0, eventListener);
                    isAdded = true;
                    break;
                }
            }

            if (isAdded === false) {
                listeners.push(eventListener);
            }
        }
    };

    /**
     * Removes a listener from the EventDispatcher object.
     * @method sap.viz.vizframe.common.events.EventDispatcher.prototype.removeEventListener
     *
     * @param {String} type
     *            The type of event.
     * @param {Function} listener
     *            The listener function that processes the event.
     * @param {Object} scope
     *            The scope.
     */
    EventDispatcher.prototype.removeEventListener = function(type, listener, scope) {
        var eventListener = this._findEventListener(type, listener, scope);
        if (eventListener) {
            var listeners = this.listeners()[type];
            listeners.splice(listeners.indexOf(eventListener), 1);
        }
    };

    /**
     * Removes the listeners of s specified event type.
     * @method sap.viz.vizframe.common.events.EventDispatcher.prototype.removeEventListeners
     *
     * @param {String} type
     *            The type of event.
     */
    EventDispatcher.prototype.removeEventListeners = function(type) {
        this.listeners()[type] = [];
    };

    /**
     * Removes all the event listeners.
     * @method sap.viz.vizframe.common.events.EventDispatcher.prototype.removeEventListeners
     *
     */
    EventDispatcher.prototype.removeAllEventListeners = function() {
        this._listeners = {};
    };

    /**
     * Checks whether the EventDispatcher object has any listeners registered for a specific type,
     * listener and scope of event.
     *
     * @param {String} type
     *            The type of event
     * @param {Function} listener
     *            The listener function that processes the event
     * @param {Object} scope
     *            scope
     * @returns {Boolean}
     */
    EventDispatcher.prototype.hasEventListener = function(type, listener, scope) {
        var eventListener = this._findEventListener(type, listener, scope);
        return eventListener !== null;
    };

    /**
     * Checks whether the EventDispatcher object has any listeners registered for a specific type
     * (with any listeners or scopes) of event.
     *
     * @param {String} type
     *            The type of event
     * @returns {Boolean}
     */
    EventDispatcher.prototype.hasEventListeners = function(type) {
        var listeners = this.listeners()[type];
        if (listeners) {
            return listeners.length > 0;
        }
        return false;
    };

    /**
     * Dispatch event.
     *
     * @param {Event} event
     *            The event object.
     */
    EventDispatcher.prototype._dispatchEvent = function(event) {
        if (this._enableDispatchEvent === undefined) {
            this._enableDispatchEvent = true;
        }
        if (this._enableDispatchEvent) {
            var type = event.type();
            var listeners = this.listeners()[type];
            if (listeners) {
                var clones = listeners.slice(0);
                for (var n = 0; n < clones.length; ++n) {
                    var listener = clones[n];
                    listener.listener.call(listener.scope, event);
                }
            }
        }
    };

    /**
     * Enable/disable dispatch event.
     * @param value Enable-true, disable-false
     */
    EventDispatcher.prototype.enableDispatchEvent = function(v) {
        if (this._enableDispatchEvent === undefined) {
            this._enableDispatchEvent = true;
        }
        if (arguments.length >= 1) {
            if (utils.isBoolean(v)) {
                this._enableDispatchEvent = v;
            }
            return this;
        } else {
            return this._enableDispatchEvent;
        }
    };
    // -------------------------------------------
    // Private Methods
    // -------------------------------------------

    /**
     * Find the EventListener.
     * @private
     *
     * @param {String} type
     *            The type of event
     * @param {Function} listener
     *            The listener function that processes the event
     * @param {Object} scope
     *            scope
     * @returns {Object|null}
     */
    EventDispatcher.prototype._findEventListener = function(type, listener, scope) {
        var listeners = this.listeners()[type];
        if (!listeners) {
            return null;
        }

        for (var n = 0; n < listeners.length; ++n) {
            var eventListener = listeners[n];
            if (eventListener.listener === listener && eventListener.scope === scope) {
                return eventListener;
            }
        }

        return null;
    };

    /**
     * Get all event listeners.(Read only)
     * @returns All event listeners.
     */
    EventDispatcher.prototype.listeners = function() {
        if (this._listeners === undefined) {
            this._listeners = {};
        }
        return this._listeners;
    };

    return EventDispatcher;
});

// @formatter:off
define('sap/viz/vizframe/common/UIControl',[
    'jquery',
    'sap/viz/vizframe/common/utils/OOUtil',
    'sap/viz/vizframe/common/events/EventDispatcher'
], function($, 
    OOUtil, 
    EventDispatcher) {
// @formatter:on

    /**
     * Base class for UI control.
     * @extends sap.viz.vizframe.common.events.EventDispatcher
     */
    var UIControl = function UIControl(dom/*HTMLElement*/) {
        UIControl.superclass.constructor.apply(this, arguments);
        this.__className = "sap.viz.vizframe.common.UIControl";

        this._dom = dom;
        this._dom$ = $(dom);
    };
    OOUtil.extend(UIControl, EventDispatcher);

    UIControl.prototype.dom$ = function() {
        return this._dom$;
    };
    /**
     * Destroy this control instance by removing all children dom elements and event listeners. The inherited class
     * should override this method to perform clean staff.
     * @method sap.viz.vizframe.common.UIControl.prototype.destroy
     */
    UIControl.prototype.destroy = function() {
        this.removeAllEventListeners();
        if (this._dom$) {
            this._dom$.empty().removeData().off();
        }
        this._dom = null;
        this._dom$ = null;
    };

    return UIControl;
});

// @formatter:off
define('sap/viz/vizframe/frame/viz/VizUtil',[
    'jquery'
], function($) {
// @formatter:on
    var VizUtil = {};
    var PROPS = ["data", "bindings", "customizations", "template", "size", "sharedRuntimeScales"];
    VizUtil.mergeOptions = function(destination, source) {
        for(var i = 0; i < PROPS.length; ++i){
            if(source[PROPS[i]]){
                destination[PROPS[i]] = source[PROPS[i]];
            }
        }
        if (source.properties) {
            destination.properties = sap.viz.vizservices.__internal__.PropertyService.mergeProperties(destination.type, destination.properties, source.properties);
        }
        if (source.scales) {
            if(source.scalesOption) {
                destination.scalesOption = $.extend({}, source.scalesOption);
            }
            destination.scales = sap.viz.vizservices.__internal__.ScaleService.mergeScales(destination.type, destination.scales, source.scales);
        }
        return destination;
    };

    return VizUtil;
});

// @formatter:off
define('sap/viz/vizframe/frame/viz/VizCache',[
    'sap/viz/vizframe/frame/viz/VizUtil'
], function(
    VizUtil
    ) {
// @formatter:on
    var VizCache = function(options) {
        this.__className = 'sap.viz.vizframe.frame.viz.VizCache';

        this._options = options;
    };

    VizCache.generateFromVizInstance = function(vizInstance, param) {
        var resetScales = param.scalesOption && param.scalesOption.level === 'user' && param.scalesOption.replace;
        var options = {
            'data' : vizInstance.data(),
            'bindings' : vizInstance.bindings(),
            'scales' : vizInstance.scales([], {
                'level': 'user',
                'isRender' : false,
                'replace': resetScales
            }),
            'properties' : vizInstance.properties({}, {
                'level': 'user',
                'isRender' : false
            }),
            'customizations' : vizInstance.customizations(),
            'template' : vizInstance.template()
        };

        var size = vizInstance.size();
        if (!size.auto) {
            options.size = size;
        }
        return new VizCache(options);
    };

    VizCache.generateFromOptions = function(options) {
        return new VizCache(options);
    };

    VizCache.prototype.options = function(value) {
        if (arguments.length) {
            this._options = value;
        } else {
            return this._options;
        }
    };

    VizCache.prototype.update = function(options) {
        VizUtil.mergeOptions(this._options, options);
    };

    return VizCache;
});

// @formatter:off
define('sap/viz/vizframe/frame/viz/Viz',[
    'sap/viz/vizframe/common/utils/OOUtil',
    'sap/viz/vizframe/common/UIControl',
    'sap/viz/vizframe/frame/viz/VizCache',
    'sap/viz/vizframe/frame/viz/VizUtil'
], function(
    OOUtil,
    UIControl,
    VizCache,
    VizUtil) {
// @formatter:on
    var Viz = function(dom, beforeRenderCallback, afterRenderCallback) {
        Viz.superclass.constructor.apply(this, arguments);
        this.__className = 'sap.viz.vizframe.frame.viz.Viz';

        this._onCaches = [];

        this._type = null;

        this._vizInstance = null;
        this._vizCache = null;

        this._beforeRenderCallback = beforeRenderCallback;
        this._afterRenderCallback = afterRenderCallback;
    };
    OOUtil.extend(Viz, UIControl);
    
    Viz.prototype._getDataRange = function(start, end){
        return this._vizInstance && this._vizInstance._getDataRange(start, end);
    };

    Viz.prototype.update = function(options) {
        this._beforeRenderCallback();
        try {
            if (!this._vizInstance) {
                this._createVizInstance(options);
            } else {
                if (options.type !== undefined && options.type !== this._type) {
                    this._vizCache = VizCache.generateFromVizInstance(this._vizInstance, options);
                    this._clearVizInstance();
                    this._createVizInstance(options);
                } else {
                    this._updateVizInstance(options);
                }
            }
        } catch (err) {
            this._afterRenderCallback();
            throw err;
        }
    };

    Viz.prototype.type = function() {
        return this._type;
    };

    Viz.prototype.save = function() {
        if (this._vizInstance) {
            return sap.viz.api.core.exportViz(this._vizInstance);
        } else {
            return {
                'type' : 'vizCache',
                'options' : this._vizCache.options()
            };
        }
    };

    Viz.prototype.load = function(json) {
        this._clearVizInstance();
        if (json.type === 'vizCache') {
            this._vizCache = VizCache.generateFromOptions(json.options);
        } else {
            this._vizCache = null;

            this._beforeRenderCallback();
            try {
                this._vizInstance = sap.viz.api.core.loadViz(json, this._dom);
                this._initVizInstance();
                this._type = json.type;
            } finally {
                this._afterRenderCallback();
            }
        }
    };

    Viz.prototype.destroy = function() {
        this._clearVizInstance();
        this._vizCache = null;

        this._onCaches = null;
    };

    ['data', 'bindings', 'properties', 'scales', 'sharedRuntimeScales', 
    'customizations', 'template'].forEach(function(name) {
        (function(name) {
            Viz.prototype[name] = function() {
                var options = {};
                var result;
                if (arguments.length >= 2) {
                    // Set with option
                    options[name] = arguments[0];
                    options[name + 'Option'] = arguments[1];
                    if (this._vizInstance) {
                        this._beforeRenderCallback();
                        result = this._vizInstance[name](options[name], options[name + 'Option']);
                        this._afterRenderCallback();
                    } else {
                        this._vizCache.update(options);
                        return this._vizCache.options()[name];
                    }
                } else if (arguments.length === 1) {
                    // Set
                    options[name] = arguments[0];
                    // Delegate to update
                    this.update(options);
                    return this;
                } else {
                    // Get
                    if (this._vizInstance) {
                        return this._vizInstance[name]();
                    } else {
                        return this._vizCache.options()[name];
                    }
                }
                // Return
                return result === this._vizInstance ? this : result;

            };
        })(name);
    });

    ['selection', 'propertyZone', 'feedingZone', 'runtimeScales', 'size'].forEach(function(name) {
        (function(name) {
            Viz.prototype[name] = function() {
                if (this._vizInstance) {
                    return this._vizInstance[name].apply(this._vizInstance, arguments);
                } else {
                    return [];
                }
            };
        })(name);
    });

    ['states', 'exportToSVGString'].forEach(function(name) {
        (function(name) {
            Viz.prototype[name] = function() {
                var result;
                if (this._vizInstance) {
                    result = this._vizInstance[name].apply(this._vizInstance, arguments);
                }
                return result === this._vizInstance ? this : result;
            }
        })(name);
    });

    Viz.prototype.on = function(type, callback) {
        if (this._vizInstance) {
            this._vizInstance.on(type, callback);
        }
        this._onCaches.push({
            'type' : type,
            'callback' : callback
        });
    };

    Viz.prototype.off = function(type) {
        if (this._vizInstance) {
            this._vizInstance.off(type);
        }
        this._onCaches = this._onCaches.filter(function(cache) {
            return type !== cache.type;
        });
    };

    Viz.prototype.zoom = function(options) {
        if (this._vizInstance) {
            this._vizInstance.states({
                zoomInOut : options
            });
        }
    };

    Viz.prototype._createVizInstance = function(options) {
        try {
            if (options.type) {
                this._type = options.type;
            }
            // Merge options from exsiting vizCache
            var mergedOptions = null;
            if (this._vizCache) {
                mergedOptions = {
                    'type' : this._type
                };
                VizUtil.mergeOptions(mergedOptions, this._vizCache.options());
                VizUtil.mergeOptions(mergedOptions, options);
            } else {
                mergedOptions = options;
            }
            mergedOptions.container = this._dom;
            // Switch to vizInstance
            this._vizInstance = sap.viz.api.core.createViz(mergedOptions);
            this._initVizInstance();
            this._vizCache = null;
        } catch (err) {
            // Switch to vizCache
            if (this._vizCache) {
                this._vizCache.options(mergedOptions);
            } else {
                this._vizCache = VizCache.generateFromOptions(options);
            }
            this._clearVizInstance();
            throw err;
        }
    };

    Viz.prototype._updateVizInstance = function(options) {
        try {
            if (options.type) {
                this._type = options.type;
            }
            this._vizInstance.update(options);
        } catch (err) {
            // Switch vizInstance to vizCache
            this._vizCache = VizCache.generateFromVizInstance(this._vizInstance, options);
            this._vizCache.update(options);

            this._clearVizInstance();

            throw err;
        }
    };

    Viz.prototype._initVizInstance = function() {
        // On renderComplete
        this._vizInstance.on('renderComplete', ( function() {
                this._afterRenderCallback();
            }.bind(this)));
        // Release on caches
        this._onCaches.forEach( function(cache) {
            this._vizInstance.on(cache.type, cache.callback);
        }.bind(this));
    };

    Viz.prototype._clearVizInstance = function() {
        if (this._vizInstance) {
            this._vizInstance.destroy();
        }
        this._vizInstance = null;
    };

    return Viz;
});

// @formatter:off
define('sap/viz/vizframe/frame/VizFrameEvent',[
    'sap/viz/vizframe/common/utils/OOUtil',
    'sap/viz/vizframe/common/events/Event'
],
function(OOUtil, Event) {
// @formatter:on
    /**
     * The VizFrame Event.
     */
    var VizFrameEvent = function(type, target, data) {
        VizFrameEvent.superclass.constructor.apply(this, arguments);
        this.__className = "sap.viz.vizframe.common.events.VizFrameEvent";
    };
    OOUtil.extend(VizFrameEvent, Event);

    VizFrameEvent.BEFORE_RENDER = "beforeRender";

    VizFrameEvent.AFTER_RENDER = 'afterRender';

    return VizFrameEvent;
});

// @formatter:off
define('sap/viz/vizframe/frame/VizFrameConfig',[
],
function() {
// @formatter:on
    var VizFrameConfig = {};

    VizFrameConfig.instance = function() {
        return JSON.parse(JSON.stringify({
            'controls' : {
                'morpher' : {
                    'enabled' : true
                }
            }
        }));
    };
    return VizFrameConfig;
});

// @formatter:off
define('sap/viz/vizframe/frame/VizFrameProxy',[
    'jquery',
    'sap/viz/vizframe/common/utils/OOUtil',
    'sap/viz/vizframe/common/events/EventDispatcher'
], function($, OOUtil, EventDispatcher) {
// @formatter:on
    var VizFrameProxy = function VizFrameProxy(vizframe) {
        this._vizframe = vizframe;
    };

    VizFrameProxy.prototype.dataset = function () {
        try {
            return this._vizframe.data.apply(this._vizframe, arguments);
        }
        catch (e) {
            return null;
        }
    };

    VizFrameProxy.prototype.vizType = function () {
        try {
            return this._vizframe.type.apply(this._vizframe, arguments);
        }
        catch (e) {
            return null;
        }
    };

    VizFrameProxy.prototype.feedingZone = function () {
        try {
            return this._vizframe.feedingZone.apply(this._vizframe, arguments);
        }
        catch (e) {
            return null;
        }
    };

    VizFrameProxy.prototype.addEventListener = function () {
        this._vizframe.addEventListener.apply(this._vizframe, arguments);
    };

    VizFrameProxy.prototype.removeEventListener = function () {
        this._vizframe.removeEventListener.apply(this._vizframe, arguments);
    };

    return VizFrameProxy;
});

// @formatter:off
define('sap/viz/vizframe/frame/ControlFactory',[
    'require'
], function(require) {
// @formatter:on
    var ControlFactory = function() {
        this.__className = "sap.viz.vizframe.frame.ControlFactory";
    };

    var clazzMap = {
        'morpher' : 'sap/viz/vizframe/controls/morpher/Morpher'
    };

    ControlFactory.createControl = function(id, dom, config, proxy) {
        var control = null;
        try {
            if (clazzMap[id]) {
                var clazz = require(clazzMap[id]);
                control = new clazz(dom, config, proxy);
            }
        } catch(e) {
        }
        return control;
    };

    return ControlFactory;
});

// @formatter:off
define('sap/viz/vizframe/frame/VizFrame',[
    'jquery',
    'sap/viz/vizframe/common/LanguageLoader',
    'sap/viz/vizframe/common/utils/OOUtil',
    'sap/viz/vizframe/common/utils/utils',
    'sap/viz/vizframe/common/events/Event',
    'sap/viz/vizframe/common/events/EventDispatcher',
    'sap/viz/vizframe/frame/viz/Viz',
    'sap/viz/vizframe/frame/VizFrameEvent',
    'sap/viz/vizframe/frame/VizFrameConfig',
    'sap/viz/vizframe/frame/VizFrameProxy',
    'sap/viz/vizframe/frame/ControlFactory',
    'exports'
], function($,
    LanguageLoader,
    OOUtil,
    utils, 
    Event,
    EventDispatcher,
    Viz,
    VizFrameEvent,
    VizFrameConfig,
    VizFrameProxy, 
    ControlFactory
    ) {
// @formatter:on
    var VizFrame = function(options, config) {
        VizFrame.superclass.constructor.call(this);
        this.__className = 'sap.viz.vizframe.frame.VizFrame';

        this._dom = options.container, this._dom$ = $(this._dom);
        this._config = $.extend(true, VizFrameConfig.instance(), config);
        this._destroyed = false;

        // Build dom tree
        this._vizInstanceContainer = document.createElement('div');
        $(this._vizInstanceContainer).appendTo(this._dom$).css({
            'width' : '100%',
            'height' : '100%'
        });
        this._viz = new Viz(this._vizInstanceContainer, function() {
            this._dispatchEvent(new VizFrameEvent(VizFrameEvent.BEFORE_RENDER, this));
        }.bind(this), function() {
            this._dispatchEvent(new VizFrameEvent(VizFrameEvent.AFTER_RENDER, this));
        }.bind(this));
        this._controlsContainer = document.createElement('div');
        $(this._controlsContainer).appendTo(this._dom$);

        // Create controls
        this._controls = {};
        var id = null;
        for (id in this._config.controls) {
            if (this._config.controls[id].enabled !== false) {
                try {
                    this._enableControl(id, this._config.controls[id].config);
                } catch (e) {
                    if (config && config.controls && config.controls[id] &&
                        config.controls[id].hasOwnProperty("enabled") &&
                        config.controls[id].enabled !== false) {
                        throw e;
                    }
                }
            }
        }
        // Create viz
        try {
            this._viz.update(options);
        } catch (err) {
            if (this._config.throwError === true) {
                throw err;
            }
        }
    };

    OOUtil.extend(VizFrame, EventDispatcher);

    // @formatter:off
    ['data', 'bindings', 'properties', 'scales', 'sharedRuntimeScales', 'runtimeScales', 'customizations',
     'template', 'exportToSVGString', "states", 'size', 'update', 'selection', 'propertyZone', 'feedingZone', 'on', 'off'].forEach(function(name) {
    // @formatter:on
        (function(name) {
            VizFrame.prototype[name] = function() {
                this._validateLifecycle();

                var result = this._viz[name].apply(this._viz, arguments);
                return result === this._viz ? this : result;
            };
        })(name);
    });
    VizFrame.prototype._getDataRange = function(start, end){
        return this._viz._getDataRange(start, end);
    };
    
    VizFrame.prototype.getControl = function(id) {
        return this._controls[id];
    };

    VizFrame.prototype.enableControl = function(id, config) {
        this._validateLifecycle();
        return this._enableControl.apply(this, arguments);
    };

    VizFrame.prototype.disableControl = function(id) {
        this._validateLifecycle();
        return this._disableControl.apply(this, arguments);
    };

    VizFrame.prototype.destroy = function() {
        this._validateLifecycle();
        // Destroy controls
        for (var id in this._controls) {
            this._disableControl(id);
        }
        // Destroy viz instance
        if (this._viz) {
            this._viz.destroy();
        }
        // Destroy dom
        this.removeAllEventListeners();
        if (this._dom$) {
            this._dom$.empty().removeData().off();
        }
        this._dom = null;
        this._dom$ = null;
        this._destroyed = true;
    };

    VizFrame.prototype.type = function(type) {
        this._validateLifecycle();
        if (arguments.length > 0) {
            this.update({
                'type' : type
            });
            return this;
        } else {
            return this._viz.type();
        }
    };

    VizFrame.prototype.save = function() {
        this._validateLifecycle();
        return this._viz.save();
    };

    VizFrame.prototype.load = function(json) {
        this._validateLifecycle();
        this._viz.load(json);
    };
    
    VizFrame.prototype.zoom = function(options) {
        this._viz.zoom(options);
    };

    VizFrame.prototype._validateLifecycle = function(options) {
        if (this._destroyed) {
            throw utils.substitute(sap.viz.extapi.env.Language.getResourceString('VIZ_FRAME_DESTORYED'));
        }
    };

    VizFrame.prototype._enableControl = function(id, config) {
        // Check already enabled
        if (this.getControl(id)) {
            return;
        }
        // Allocate dom, Create control, connect control
        var dom = this._attachControl(id);
        var control = ControlFactory.createControl(id, dom, config, new VizFrameProxy(this));
        if (control) {
            if (id === 'morpher') {
                control.bindVizInstanceContainer(this._vizInstanceContainer);
            }
            this._controls[id] = control;
        } else {
            throw utils.substitute(sap.viz.extapi.env.Language.getResourceString('VIZ_FRAME_CONTROL_LOAD_ERROR'), id);
        }
    };

    VizFrame.prototype._disableControl = function(id) {
        var control = this._controls[id];
        if (!control) {
            return;
        }
        if (control.dom$()) {
            control.dom$().detach();
        }
        control.destroy();
        delete this._controls[id];
    };

    VizFrame.prototype._attachControl = function(id) {
        var dom$ = null;
        if (id === 'morpher') {
            dom$ = $(document.createElement('div')).appendTo(this._controlsContainer);
            dom$.css({
                'position' : 'absolute',
                'left' : '0px',
                'top' : '0px'
            });
        }
        return dom$ ? dom$.get(0) : null;
    };

    return VizFrame;
});

// @formatter:off
define('sap/viz/vizframe/api/VizFrame',[
    "sap/viz/vizframe/api/APIUtil",
    "sap/viz/vizframe/frame/VizFrame",
    "require",
], function(APIUtil, VizFrame) {
// @formatter:on

    /**
     * VizFrame wraps Info Chart from factory consumption mode to be standard UI control with full lifecycle support.<br/>
     * VizFrame provides same Info Chart Consumption API (dataset, bindings, scales, properties, customizations and events...) with some extra API of built-in controls.<br/>
     * VizFrame provides some optional built-in visualization specific controls like Morpher, and expose extra API via extending Consumption API. Consumer application can decide to enable or disable the built-in controls.<br/><ul>
     * @class sap.viz.vizframe.VizFrame
     * @param {Object} options
     * <pre>
     * {
     *   "type": String, // Refer to the Chart Property documentation for all supported chart types.
     *   "properties": Object, // (Optional) Refer to the Chart Property documentation for all supported options for each chart type.
     *   "size": Object, // (Optional) Sets the width and height of the chart. For example, {width: 100, height: 200}. If the size is not supplied, the size of the rendered chart uses the size of the HTML element referred to in 'container'.
     *   "container": HTMLDivElement, // A reference to the containing HTML element in the HTML page.
     *   "data": {@link sap.viz.api.data.FlatTableDataset}, // Set the data of the chart.
     *   "bindings": Array, // Assigns data binding information.
     *   "events": Object, // (Optional) Sets the customized function when a specified event is called. The schema of the Object is {'<event name>': {fn: function(){}, scope: this}}. Refer to the Chart Property documentation for all supported events for each chart. For example: {'initialized':{ fn: function(){return;}, scope: this}}.
     *   "template": String, // (Optional) Sets the template id for this chart, if invalid, the current global template will be used.
     *   "scales": Array // Sets the scales of the chart.
     *   "customizations": Object // Sets the customizations of the chart.
     * }
     * </pre>
     * @param {Object} [config]
     *      A configuration options for initial declarative vizframe setup.
     *      <pre>
     *      {
     *          controls : {
     *              morpher : {
     *                  enabled : true
     *              }
     *          }
     *      }
     *      </pre>
     * @return {Object} {@link sap.viz.vizframe.VizFrame} VizFrame itself.<br/>
     * Sample code:<br/>
     * <pre>
     * var options = {
     *     type : type, 
     *     container : div, 
     *     data : dataset, 
     *     bindings : bindings
     * };
     * var vizFrame = new VizFrame(options);
     * </pre>
     */
    
    var VizFrameAPI = sap.viz.vizframe.VizFrame = function(div, uiConfig){
        this.__internal_reference_VizFrame__ = new VizFrame(div, uiConfig);
        this.__internal_reference_VizFrame__.__wrapper__ = this;
    };
    
    APIUtil.setWrapping("sap.viz.vizframe.VizFrame", VizFrameAPI);
   
    APIUtil.buildProxyMethods(VizFrameAPI.prototype, "__internal_reference_VizFrame__",
        ["enableControl",
        "disableControl",
        "destroy",
        "on",
        "off",
        "type",
        "update",
        "data",
        "bindings",
        "properties",
        "scales",
        "customizations",
        "template",
        "selection",
        "propertyZone",
        "feedingZone",
        "size",
        "save",
        "load",
        "exportToSVGString",
        //sharedRuntimeScales, runtimeScales, states, zoom are internal apis
        "sharedRuntimeScales",
        "runtimeScales",
        "states",
        "zoom",
        "_getDataRange"
        ].join(" "));

    /**
     * Get/Set data binding information to charts. For more details, see "bindings" api on sap.viz.api.core.VizInstance.
     * @method sap.viz.vizframe.VizFrame.prototype.bindings
     * @param {Array|null} [binding]
     * @return {Array}
     * If getting the binding, it returns bindings array;
     * if setting the binding, it returns instance of VizFrame.
     */

    /**
     * Get/Set chart data. For more details, see "data" api on sap.viz.api.core.VizInstance.
     * @method sap.viz.vizframe.VizFrame.prototype.data
     * @param {sap.viz.api.data.FlatTableDataset} [value]
     * @return {sap.viz.api.data.FlatTableDataset}
     */

    /**
     * Destroy VizFrame.
     * @method sap.viz.vizframe.VizFrame.prototype.destroy
     */

    /**
     * Disable control on VizFrame.
     * @method sap.viz.vizframe.VizFrame.prototype.disableControl
     * @param {String} id
     *       Built-in control's id.
     * @example <caption>Sample Code:</caption>
     * vizFrame.disableControl("morpher");//Disable "morpher" control from VizFrame.
     */

    /**
     * Enable control on VizFrame.
     * @method sap.viz.vizframe.VizFrame.prototype.enableControl
     * @param {String} id
     *       Built-in control's id.
     * @param {Object} [config]
     *       Configuration for the control.
     * @example <caption>Sample Code:</caption>
     * var vizFrame = new VizFrame(...);
     * vizFrame.enableControl("morpher");//Enable "morpher" control to VizFrame.
     */

    /**
     * Get current feeding zone information. For more details, see "feedingZone" api on sap.viz.api.core.VizInstance.
     * @method sap.viz.vizframe.VizFrame.prototype.feedingZone
     * @return {Array} Feeding information group by the visualization element.
     */

    /**
     * Deserialize VizFrame from JSON object.<br/>
     * @method sap.viz.vizframe.VizFrame.prototype.load
     * @param {JSON} valueJSON
     * @example <caption>Sample Code:</caption>
     *  var vizFrameA = new VizFrame(...);
     *  var jsonA = vizFrameA.save();
     *  var vizFrameB = new VizFrame(...);
     *  vizFrameB.load(jsonA);              
     */

    /**
     * Remove event listener on viz instance. For more details, see "off" api on sap.viz.api.core.VizInstance.
     * @method sap.viz.vizframe.VizFrame.prototype.off
     * @param {String} evtType
     * @return {Object} {@link sap.viz.vizframe.VizFrame} VizFrame itself.
     */

    /**
     * Add event listener on viz instance. For more details, see "on" api on sap.viz.api.core.VizInstance.
     * @method sap.viz.vizframe.VizFrame.prototype.on
     * @param {String} evtType
     * @param {Function} callback
     * @return {Object} {@link sap.viz.vizframe.VizFrame} VizFrame itself.
     */


    /**
     * Get/Set chart properties. For more details, see "properties" api on sap.viz.api.core.VizInstance.
     * @method sap.viz.vizframe.VizFrame.prototype.properties
     * @param {Object} props Refers to Chart Property
     * @return {Object} {@link sap.viz.vizframe.VizFrame} VizFrame itself.
     */

    /**
     * Get current property zone information. For more details, see "propertyZone" api on sap.viz.api.core.VizInstance.
     * @method sap.viz.vizframe.VizFrame.prototype.propertyZone
     * @return {Array} Property information group by visualization element.
     */

    /**
     * Serialize VizFrame to a JSON object. The serialization includes viz instance(type, data, properties, bindings, size, scales, customizations and template).<br/>
     * @method sap.viz.vizframe.VizFrame.prototype.save
     * @return {JSON}
     * @example <caption>Sample Code:</caption>
     * var vizFrame = new VizFrame(...);
     * var vizFrameJSON = vizFrame.save();
     */

    /**
     * Get/Set scales. For more details, see "scales" api on sap.viz.api.core.VizInstance.
     * @method sap.viz.vizframe.VizFrame.prototype.scales
     * @param {Array} [scales] Scale settings.
     * @return {Array} Scale settings of current VizFrame.
     */
    
    /**
     * Get/Set customizations. For more details, see "customizations" api on sap.viz.api.core.VizInstance.
     * @method sap.viz.vizframe.VizFrame.prototype.customizations
     * @param {Object} [customizations] Customizations setting with id and customOverlayProperties.
     * @return {Object} Customizations setting of current VizFrame.
     */

    /**
     * Get/Set selected data points. For more details, see "selection" api on sap.viz.api.core.VizInstance.
     * @method sap.viz.vizframe.VizFrame.prototype.selection
     * @param {Array}  [selectionPoint] Array of Objects with either data or ctx should be set to points.
     * @param {Object} [options] Selection options.
     * @returns {Array|Boolean}
     */

    /**
     * Get/Set chart size. For more details, see "size" api on sap.viz.api.core.VizInstance.
     * @method sap.viz.vizframe.VizFrame.prototype.size
     * @param {Object} [value]
     *     {"width" : Number, "height" : Number, ["auto" : Boolean]} | {"auto" : Boolean}
     * @return {Object} Size of VizFrame.
     */

    /**
     * Get/Set VizFrame templateId. For more details, see "template" api on sap.viz.api.core.VizInstance.
     * @method sap.viz.vizframe.VizFrame.prototype.template
     * @param {string} [value]
     * @return {string|sap.viz.vizframe.VizFrame}.
    */

    /**
     * Get/Set chart type.
     * @method sap.viz.vizframe.VizFrame.prototype.type
     * @param {String} [value]
     *      Chart type
     * @return {String|Object}
     * If getting the type, it returns chart type;
     * if setting the type, it returns instance of VizFrame.
     * @example <caption>Sample Code:</caption>
     * var vizFrame = new VizFrame(...);
     * vizFrame.type("info/line");// Set VizFrame type.
     * vizFrame.type();// Get VizFrame type.
     */

    /**
     * Update various options in one API. And VizFrame provide another API type() to update chart type. 
     * @method sap.viz.vizframe.VizFrame.prototype.update
     * @param {Object} updates
     * <pre>
     * {
     *     "data": {@link sap.viz.api.data.FlatTableDataset},
     *     "bindings": Array, // Assigns data binding information.
     *     "properties": Object, // Refer to the Chart Property documentation for all supported options for each chart type.
     *     "scales" : Array, // Set the scales of the chart.
     *     "customizations" : Object, // Set the customizations of the chart.
     *     "size" : Object, // Set the size of the chart.
     *     "type" : String, // Set the type of the chart.
     *     "template" : String // Sets the new template id for this chart, if invalid, the current global template will be used.
     * }
     * </pre>
     * @return {Object} {@link sap.viz.vizframe.VizFrame} VizFrame itself.
     */    

    /**
     * Export the current viz as SVG String.
     * The viz is ready to be exported to svg ONLY after the initialization is finished.
     * Any attempt to export to svg before that will result in an empty svg string.
     * @method sap.viz.vizframe.VizFrame.prototype.exportToSVGString
     * @param {Object} [option] 
     * <pre>
     * {
     *     width: Number - the exported svg will be scaled to the specific width.
     *     height: Number - the exported svg will be scaled to the specific height.
     *     hideTitleLegend: Boolean - flag to indicate if the exported svg includes the original title and legend.
     *     hideAxis: Boolean - flag to indicate if the exported svg includes the original axis.
     * }
     * </pre>
     * @return {Object} the SVG Object of the current viz or empty svg if error occurs.
     */

     
    return VizFrameAPI;
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
