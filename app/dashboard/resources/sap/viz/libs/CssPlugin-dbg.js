
sap.ui.define([], function(){

    function CssPlugin(resourceLoaderFunction, log) {
        this._resourceLoaderFunction = resourceLoaderFunction;
        this._log = log;
    }

    // Compatibility functions:

    // Gets the document head in a cross-browser manner
    var getHead = function () {
        return document.head || document.getElementsByTagName("head")[0] || document.documentElement;
    };

    // Convert a url into a fully qualified url.
    var qualifyUrl = function(url) {
        if(/^http[s]?:\/\//.test(url)) {
            return url;
        } else {
            var a = document.createElement('a');
            a.href = url;
            return a.href;
        }
    };

    // Convert any relative urls within the css to absolute urls.
    var convertRelativeUrlsToAbsolute = function(log, absoluteCssUrl, css) {
        // The relative url's are all relative to the css file.  Strip the css file name
        // off of its absolute url to use as a base for building our new urls.
        // Base url should look like "http://machine:port/sap/bi/bundles/sap/bi/va/common/stylesheets/"
        var idx = absoluteCssUrl.lastIndexOf("/");
        var baseUrl = absoluteCssUrl.substring(0, idx + 1);

        // Matches something like: url('../images/foo.png')
        var URL_REGEX = /url ?\((\"|\')?([a-zA-Z0-9\.\/\-\_]*)(\"|\')?\)/gm;
        var result = css.replace(URL_REGEX, function(fullMatch, openQuote, relUrl, closeQuote, offset, fullString){
            if (relUrl && relUrl.length > 0) {
                // Should produce a full url like this:
                // "http://machine:port/sap/bi/bundles/sap/bi/va/common/stylesheets/../images/foo.png"
                log("Converting " + relUrl + " to " + (baseUrl + relUrl));
                return "url(" + baseUrl + relUrl + ")";
            }
        });
        return result;
    };

    //The RequireJS module methods
    CssPlugin.prototype.normalize = function(name, normalizer) {
        if (!/\.css$/.test(name)) {
            name = name + ".css";
        }

        return normalizer(name);
    };

    CssPlugin.prototype.load = function (name, req, load, config) {

        var cssUrl = (req.toUrl ? req.toUrl(name) : name);
        var originalUrl;
        if (this._resourceLoaderFunction) {
            // A resource loader function has been provided - see if it can load the content for this css url.
            var cssContent = this._resourceLoaderFunction(cssUrl);
            if(cssContent) {
                // We do have content for the css!  Make sure it doesn't have any relative urls as they will be broken.
                var absoluteCssUrl = qualifyUrl(cssUrl);
                cssContent = convertRelativeUrlsToAbsolute(this._log, absoluteCssUrl, cssContent);

                // Add source url to help with debugging
                cssContent += "\n/*# sourceURL="+ absoluteCssUrl + " */";

                // Create an object url for it so it can be linked into
                // the html doc just like it was a remote resource.
                this._log("CssPlugin.load() returning cached content for url: " + cssUrl);
                originalUrl = cssUrl;
                var URLFactory = window.URL || window.webkitURL;
                var cssBlob = new window.Blob([cssContent], {type: 'text/css'});
                cssUrl = URLFactory.createObjectURL(cssBlob);
            } else {
                this._log("CssPlugin.load() loading from network for url: " + cssUrl);
            }
        }

        var link = document.createElement("link");

        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = cssUrl;

        if (originalUrl) {
            link.setAttribute("bundle_cache_src", originalUrl);
        }

        link.onload = function(e) {
            load(this.sheet);
            this.onerror = this.onload = null;
        };
        link.onerror = function(e) {
            load.error(new Error("Failed to load " + this.href));
            this.onerror = this.onload = null;
        };

        getHead().appendChild(link);
    };

    CssPlugin.prototype.pluginBuilder = "cssBuilder";
    return CssPlugin;
});
