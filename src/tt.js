/** "tt.js" -Highspeed SelectorBased Library- author: Kei Takahashi(twitter@dameleon, mail:dameleon[at]gmail.com) license: MIT version: 0.2.0 */
;(function(global, document, isArray, isNodeList, undefined) {
    "use strict";

    var IDENT = "tt",
        querySelectorRe = /^(.+[\#\.\s\[>:,]|[\[:])/,
        loaded = false,
        loadQueue = [],
        delegateListeners = {},
        domTester = document.createElement("div");

    // for old android compatiblity
    // Object.keys - MDN https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Object/keys#Compatiblity
    if (!Object.keys) {
        Object.keys=function(){var e=Object.prototype.hasOwnProperty,f=!{toString:null}.propertyIsEnumerable("toString"),c="toString toLocaleString valueOf hasOwnProperty isPrototypeOf propertyIsEnumerable constructor".split(" "),g=c.length;return function(b){if("object"!==typeof b&&"function"!==typeof b||null===b){throw new TypeError("Object.keys called on non-object");}var d=[],a;for(a in b){e.call(b,a);d.push(a);}if(f){for(a=0;a<g;a++){e.call(b,c[a]);d.push(c[a]);}return d;}};}();
    }
    // String.prototype.trim = MDN https://developer.mozilla.org/en/docs/JavaScript/Reference/Global_Objects/String/trim#Compatibility
    if (!String.prototype.trim) {
        String.prototype.trim=function(){return this.replace(/^\s+|\s+$/g,"");};
    }

    // call load callback queue
    document.addEventListener("DOMContentLoaded", function() {
        loaded = true;
        for (var i = 0, iz = loadQueue.length; i < iz; ++i) {
            loadQueue[i]();
        }
    }, false);

    //
    function tt(mix, parent) {
        var target = null,
            selector = "";

        if (typeof mix === "string") {
            selector = mix;
            parent = parent || document;
            target = querySelectorRe.test(mix) ?
                        parent.querySelectorAll(mix) :
                     mix[0] === "#" ?
                        [parent.getElementById(mix.substring(1, mix.length))] :
                     mix[0] === "." ?
                        parent.getElementsByClassName(mix.substring(1, mix.length)) :
                        parent.getElementsByTagName(mix);
        } else if (mix) {
            if (mix.nodeType === 1) {
                target = [mix];
            } else if (isNodeList(mix) ||
                      (isArray(mix) && mix.length && mix[0].nodeType)) {
                target = mix;
            } else if (mix === document || mix === document.body) {
                target = [document.body];
            } else if (typeof mix === "function") {
                if (loaded) {
                    mix();
                } else {
                    loadQueue.push(mix);
                }
            } else if (mix instanceof TT) {
                return mix;
            } else {
                throw new Error("argument type error");
            }
        }
        return new TT(target || [], selector);
    }

    // ##### object method
    tt.isArray = isArray;

    tt.isNodeList = isNodeList;

    tt.type = function(target, matches) {
        var res = target === null     ? "null" :
                  target === void 0   ? "undefined" :
                  target === global   ? "window" :
                  target === document ? "document" :
                  target.nodeType     ? "node" :
                  isArray(target)     ? "array" :
                  isNodeList(target)  ? "nodelist" : "";

        if (!res) {
            res = typeof target;
            if (res === "object") {
                res = Object.prototype.toString.call(target).
                      toLowerCase().match(/.*\s([a-z]*)\]/)[1];
            }
        }
        if (!matches) {
            return res;
        } else if (isArray(matches)) {
            for (var i = 0, iz = matches.length; i < iz; ++i) {
                if (matches[i] === res) {
                    return true;
                }
            }
            return false;
        } else {
            return matches === res;
        }
    };

    tt.each = function(mix, fn) {
        var arr, key,
            i = 0, iz;

        if (isArray(mix)) {
            iz = mix.length;
            for (; i < iz; ++i) {
                fn(mix[i], i);
            }
        } else if (typeof mix === "object") {
            arr = Object.keys(mix);
            iz = arr.length;
            for (; i < iz; ++i) {
                key = arr[i];
                fn(key, mix[key]);
            }
        }
    };

    tt.match = function(mix, fn) {
        var arr,
            key, res = {},
            i = 0, iz;

        if (isArray(mix)) {
            iz = mix.length;
            for (; i < iz; ++i) {
                if (fn(mix[i], i)) {
                    return mix[i];
                }
            }
        } else if (typeof mix === "object") {
            arr = Object.keys(mix);
            iz = arr.length;
            for (; i < iz; ++i) {
                key = arr[i];
                if (fn(key, mix[key], i)) {
                    res[key] = mix[key];
                    return res;
                }
            }
        }
        return null;
    };

    tt.extend = function() {
        var args = [].slice.call(arguments),
            i = 1, iz = args.length,
            deep = false,
            arg, target;

        if (args[0] === true) {
            deep = true;
            ++i;
        }
        target = args[(i - 1)] || {};

        for (; i < iz; ++i) {
            arg = args[i];
            if (tt.type(arg) !== "object") {
                continue;
            }
            tt.each(Object.keys(arg), _extend);
        }
        return target;

        function _extend(key, index) {
            if (deep &&
                tt.type(target[key], "object") &&
                tt.type(arg[key], "object")) {
                    tt.extend(target[key], arg[key]);
            } else {
                target[key] = arg[key];
            }
        }
    };

    tt.proxy = function() {
        if (arguments.length < 2) {
            throw new Error('Error: missing argument error');
        }
        var args = [].slice.call(arguments),
            func = args.shift(),
            context = args.shift(),
            tmp;

        if (typeof context === 'string') {
            tmp = func[context];
            context = func;
            func = tmp;
        }
        return function() {
            return func.apply(context, args);
        };
    };

    tt.parseJSON = function(text) {
        if (!text) {
            return {};
        } else if (typeof text === "object") {
            return text;
        }
        // idea from @uupaa
        var obj;

        try {
            obj = JSON.parse(text);
            return obj;
        } catch (p_o) {}
        try {
            /*jshint evil: true */
            obj = (new Function('return ' + text))();
        } catch (o_q) {
            throw new Error("Error: can't parse text to json");
        }
        return obj;
    };

    tt.query2object = function(query) {
        if (!tt.type(query, "string")) {
            return {};
        }
        var result = {},
            pair = query.split("&"),
            i = 0, iz = pair.length;

        for (; i < iz; ++i) {
            var k_v = pair[i].split("=");

            result[k_v[0]] = k_v[1];
        }
        return result;
    };

    tt.param = function(obj) {
        if (!tt.type(obj, "object")) {
            return obj;
        }
        var key, keys = Object.keys(obj),
            i = 0, iz = keys.length,
            results = [];

        for (;i < iz; ++i) {
            key = keys[i];
            results.push(encodeURIComponent(key) + "=" + encodeURIComponent(obj[key]));
        }
        return results.join("&");
    };

    tt.triggerEvent = function(node, event, type, bubbles, cancelable) {
        if (!node || !event) {
            throw new Error("Error: missing argument error");
        }
        if ("string" !== typeof type) {
            type = event;
            event = type === "click" ? "MouseEvents" : "Event";
        }
        var ev = document.createEvent(event);

        ev.initEvent(
                type,
                (bubbles === undefined) ? false : bubbles,
                (cancelable === undefined) ? false : cancelable);
        node.dispatchEvent(ev);
    };

    tt.cssPrefix = function(value, prefix) {
        var res = [];

        prefix = prefix || ["webkit", "moz", "o", "ms", "khtml"];
        tt.each(prefix, function(str, index) {
            res[index] = "-" + str + "-" + value;
        });
        return res;
    };

    tt.cssCamelizer = function(str) {
        if (!str || typeof str !== "string") {
            throw new Error("Error: argument error");
        }
        var res = "";

        if (str[0] === "-") {
            str = str.substr(1, str.length);
        }
        tt.each(str.split("-"), function(value, index) {
            if (!index) {
                res += value;
                return;
            }
            res += value[0].toUpperCase() + value.substr(1, value.length);
        });
        return res;
    };

    tt.cssHyphenizer = function(str) {
        if (!str || typeof str !== "string") {
            throw new Error("Error: argument error");
        }
        var prefix = ["webkit", "moz", "o", "ms", "khtml"],
            upperRe = /[A-Z]/g,
            upperStr = str.match(upperRe),
            res = "";

        tt.each(str.split(upperRe), function(value, index) {
            if (prefix.indexOf(value) > -1) {
                res += "-" + value;
                return;
            } else if (!index) {
                res += value;
                return;
            }
            res += ("-" + upperStr.shift().toLowerCase() + value);
        });
        return res;
    };

    tt.tag = function(name, raw) {
        if (!name || typeof name !== "string") {
            throw new Error("Error: argument error");
        }
        var tag = document.createElement(name);

        return raw ? tag : tt(tag) ;
    };

    tt.createEnvData = function(nav) {
        var res = {},
            ua = (nav || global.navigator).userAgent.toLowerCase();

        res.android = /android/.test(ua);
        res.ios = /ip(hone|od|ad)/.test(ua);

        if (!res.android && !res.ios) {
            res.windowsPhone = /windows\sphone/.test(ua);
            res.ie = /msie/.test(ua);
        }

        res.chrome = /(chrome|crios)/.test(ua);
        res.firefox = /firefox/.test(ua);
        res.opera = /opera/.test(ua);
        res.androidBrowser = !res.chrome && res.android && /applewebkit/.test(ua);
        res.mobileSafari = !res.chrome && res.ios && /applewebkit/.test(ua);

        res.version =
            (res.androidBrowser || res.android && res.chrome) ? ua.match(/android\s(\S.*?)\;/) :
            (res.mobileSafari || res.ios && res.chrome) ? ua.match(/os\s(\S.*?)\s/) :
            null;
        res.version = res.version ?
            res.ios ?
                res.version[1].replace("_", ".") :
                res.version[1] :
            null;
        res.versionCode = _getVersionCode(res.version);
        res.supportTouch = "ontouchstart" in global;

        return res;

        function _getVersionCode(version) {
            if (!version) {
                return null;
            }
            var res, digit = 4, diff = 0;

            version = version.replace(/\D/g, "");
            diff = digit - version.length;

            if (diff > 0) {
                res = (+version) * Math.pow(10, diff);
            } else {
                res = +version;
            }
            return res;
        }
    };

    tt.env = tt.createEnvData(navigator);

    tt.ajax = function(mix, setting) {
        var called = false,
            xhr = new XMLHttpRequest();

        setting = setting || {};
        if (tt.type(mix, "object")) {
            setting = mix;
        } else if (tt.type(mix, "string")) {
            setting.url = mix;
        } else {
            throw new Error("Error: missing argument");
        }

        setting = tt.extend({
            async       : true,
            beforeSend  : null,
            cache       : true,
            complete    : null,
            contentType : "application/x-www-form-urlencoded; charset=UTF-8",
            context     : document.body,
            data        : null,
            dataType    : "text",
            error       : null,
            headers     : null,
            mimeType    : null,
            success     : null,
            timeout     : 0,
            type        : "GET",
            url         : "",
            user        : "",
            password    : ""
        }, setting);

        setting.type = setting.type.toUpperCase();

        if (setting.data && setting.type === "GET") {
            setting.url =
                setting.url +
                setting.url.indexOf("?") > -1 ? "&" : "?" +
                tt.param(setting.data);
            setting.data = null;
        } else {
            setting.data = tt.param(setting.data);
        }

        xhr.onerror = function() {
            _callCallbacks(0);
        };

        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                _callCallbacks(xhr.status);
            }
        };

        xhr.open(setting.type,
                 setting.url,
                 setting.async,
                 setting.user,
                 setting.password);

        if (setting.type === "POST") {
            xhr.setRequestHeader("Content-type", setting.contentType);
            xhr.setRequestHeader("Content-length", setting.data.length);
        }
        if (tt.type(setting.headers, "object")) {
            tt.each(setting.headers, function(key, value) {
                xhr.setRequestHeader(key, value);
            });
        }
        if (setting.dataType) {
            try {
                xhr.responseType = setting.dataType;
            } catch (e) {
                xhr.responseType = "text";
            }
        }
        if (setting.mimeType) {
            xhr.overrideMimeType(setting.mimeType) ;
        }
        if (setting.beforeSend) {
            setting.beforeSend(xhr);
        }
        if (setting.timeout) {
            xhr.timeout = setting.timeout;
        }
        xhr.send(setting.data);

        return xhr;

        function _callCallbacks(statusCode) {
            if (called) {
                return;
            }
            called = true;

            var res, context = setting.context;

            if (statusCode >= 200 && statusCode < 400) {
                res = xhr.response;
                if (setting.dataType === "json" && tt.type(res, "string")) {
                    res = tt.parseJSON(res);
                }
                if (setting.success) {
                    setting.success.apply(context, [res, statusCode, xhr]);
                }
            } else {
                if (setting.error) {
                    setting.error.apply(context, [xhr, statusCode]);
                }
            }
            if (setting.complete) {
                setting.complete.apply(context, [xhr, statusCode]);
            }
            xhr = null;
        }
    };


    /**
     * create TT typed object with NodeElements
     *
     * @class TT
     * @constructor
     */
    function TT(nodes, selector) {
        var i = 0, iz;

        this.selector = selector;
        this.length = iz = nodes.length;
        this._delegates = {};
        this._data = {};
        for (; i < iz; ++i) {
            this[i] = nodes[i];
        }
        return this;
    }

    /**
     * TT methods
     *
     * @property prototype
     * @type Object
     */
    TT.prototype = tt.fn = {
        constructor: TT,

        /**
         * Returns NodeElements
         *
         * @method get
         * @param {Number} index NodeElements index
         * @return {NodeElement} registered NodeElement
         */
        get: function(index) {
            return this[index || 0];
        },

        /**
         * Returns array in NodeElements
         *
         * @method toArray
         * @return {Array} registered NodeElements
         */
        toArray: function() {
            var arr = [];

            this.each(function(index) {
                arr[index] = this;
            });
            return arr;
        },

        /**
         * Call function with context of NodeElement and parameter of elements index number
         *
         * @method each
         * @param {Function} fn Function to be executed repeatedly
         * @return {Object} TT object
         */
        each: function(fn) {
            var i = 0, iz = this.length;

            for (; i < iz; ++i) {
                fn.call(this[i], i);
            }
            return this;
        },

        /**
         * Call function with context of NodeElement and parameter of elements index number
         * If it returns true, then this function return context that matches
         *
         * @method match
         * @param {Function} fn Function to be executed repeatedly
         * @return {Object} TT Object
         */
        match: function(fn) {
            var i = 0, iz = this.length;

            for (; i < iz; ++i) {
                if (fn.call(this[i], i)) {
                    return this[i];
                }
            }
            return null;
        },

        /**
         * Bind events to NodeElement
         *
         * @method on
         * @param {String} type
         * @param {String/Function} mix
         * @param {Function} [options] callback
         * @return {Object} TT Object
         */
        on: function(type, mix, callback) {
            if (tt.type(mix, 'string')) {
                this.delegate(type, mix, callback);
            } else {
                this.bind(type, mix);
            }
            return this;
        },

        /**
         * Un bind events from NodeElement
         *
         * @method off
         * @param {String} type
         * @param {String/Function} mix
         * @param {Function} callback
         * @return {Object} TT Object
         */
        off: function(type, mix, callback) {
            if (tt.type(mix, 'string')) {
                this.undelegate(type, mix, callback);
            } else {
                this.unbind(type, mix);
            }
            return this;
        },

        /**
         * Bind events to NodeElement
         * This is simply wrapper of addEventListener
         *
         * @method bond
         * @param {String} type
         * @param {Function/Object} callback
         * @param {Bool} [options] capture
         * @return {Object} TT Object
         */
        bind: function(type, mix, capture) {
            capture = capture || false;
            this.each(function() {
                this.addEventListener(type, mix, capture);
            }, true);
            return this;
        },

        /**
         * Un bind events from NodeElement
         * This is simply wrapper of removeEventListener
         *
         * @method unbind
         * @param {String} type
         * @param {Function/Object} mix
         * @return {Object} TT Object
         */
        unbind: function(type, mix) {
            this.each(function() {
                this.removeEventListener(type, mix);
            }, true);
            return this;
        },

        /**
         * Bind events to NodeElement
         * To bind the event of delegate type
         *
         * @method delegate
         * @param {String} type
         * @param {String/Object} target
         * @param {Function/Object} callback
         * @return {Object} TT Object
         */
        delegate: function(type, target, callback) {
            var delegate = this._delegates[type],
                listener = {
                    target: target,
                    callback: callback
                };

            if (!delegate) {
                delegate = this._delegate[type] = {};
                delegate.listeners = [];
                delegate.handler = function(ev) {
                    var event, eventTarget = ev.target;

                    tt.match(delegate.listeners, function(listener) {
                        var match = tt(listener.target).match(function() {
                            var res = this.compareDocumentPosition(eventTarget);

                            if (res === 0 || res & global.Node.DOCUMENT_POSITION_CONTAINED_BY) {
                                return true;
                            }
                            return false;
                        });

                        if (match) {
                            event = tt.extend({}, ev);
                            event.currentTarget = match;
                            if (typeof listener.callback === "function") {
                                listener.callback(event);
                            } else if ("handleEvent" in listener.callback) {
                                listener.callback.handleEvent(event);
                            }
                            return true;
                        }
                        return false;
                    });
                };
                this.bind(type, delegate.handler);
            }
            delegate.listeners.push(listener);
            return this;
        },

        /**
         * Un bind events from NodeElement
         * To un bind the event of delegate type
         *
         * @method undelegate
         * @param {String} type
         * @param {String/Function} mix
         * @param {Function} callback
         * @return {Object} TT Object
         */
        undelegate: function(type, target, callback) {
            var delegate = this._delegates[type],
                listeners = delegate.listeners;

            if (!listeners || listeners.length === 0) {
                return this;
            }
            tt.match(listeners, function(listener, index) {
                if (listener.target === target &&
                    listener.callback === callback) {
                        listeners.splice(index, 1);
                        return true;
                }
                return false;
            });
            if (listeners.length === 0) {
                this.unbind(type, delegate.handler);
                delegate = this._delegates[type] = {};
            }
            return this;
        },

        /**
         * Add class name
         *
         * @method addClass
         * @param {String} classname
         * @return {Object} TT object
         */
        addClass: domTester.classList ? _addClassByClassList : _addClassByClassName,

        /**
         * Remove class name
         *
         * @method removeClass
         * @param {String} classname
         * @return {Object} TT object
         */
        removeClass: domTester.classList ? _removeClassByClassList : _removeClassByClassName ,

        /**
         * Search class name
         *
         * @method hasClass
         * @param {String} classname
         * @return {Object} TT object
         */
        hasClass: domTester.classList ? _hasClassByClassList : _hasClassByClassName,

        /**
         * Toggle class name
         *
         * @method toggleClass
         * @param {String} classname
         * @param {Bool} strict
         * @return {Object} TT object
         */
        toggleClass: function(className, strict) {
            var that = this;

            if (strict) {
                that.each(function() {
                    var ttObj = tt(this);

                    if (ttObj.hasClass(className)) {
                        ttObj.removeClass(className);
                    } else {
                        ttObj.addClass(className);
                    }
                });
            } else {
                if (tt(that[0]).hasClass(className)) {
                    that.removeClass(className);
                } else {
                    that.addClass(className);
                }
            }
            return this;
        },

        /**
         * Find NodeElements under registered NodeElements
         *
         * @method find
         * @param {String} query
         * @return {Object} TT object
         */
        find: function(query) {
            var res = [];

            this.each(function() {
                res = res.concat(tt(query, this).toArray());
            });
            return tt(res);
        },

        /**
         * Find NodeElement from registered elements
         *
         * @method contains
         * @param {String/Object} mix QueryString, NodeElement, NodeList
         * @return {Node} matches NodeElement
         */
        contains: function(mix) {
            var res, target = tt(mix);

            res = this.match(function() {
                var root = this,
                    match = target.match(function() {
                        var pos = root.compareDocumentPosition(this);

                        return (pos === 0 || (pos & Node.DOCUMENT_POSITION_CONTAINED_BY)) ?
                                true :
                                false;
                    });

                return match ? true : false;
            });
            return res;
        },

        /**
         * Set attribute values
         * Get attributes list or attribute value
         *
         * @method attr
         * @param {String} mix QueryString, NodeElement, NodeList
         * @param {String/Object} mix QueryString, NodeElement, NodeList
         * @return {Object/String} Key-value object of attributes or attribute value
         */
        attr: function(mix, value) {
            var that = this, attrs;

            switch (arguments.length) {
            case 0:
                mix = {};
                attrs = this[0].attributes;
                for (var i = 0, iz = attrs.length; i < iz; ++i) {
                    mix[attr.nodeName] = attr.nodeValue;
                }
                return mix;
            case 1:
                if (typeof mix === "object") {
                    tt.each(mix, function(key) {
                        _setAttr(key, mix[key]);
                    });
                } else {
                    return this[0].getAttribute(mix);
                }
                break;
            case 2:
                _setAttr(mix, value);
                break;
            }
            return this;

            function _setAttr(key, value) {
                if (value === undefined || value === null) {
                    value = "";
                }
                that.each(function() {
                    if (value === "") {
                        this.removeAttribute(key);
                        return;
                    }
                    this.setAttribute(key, value);
                });
            }
        },

        /**
         * Replace html in registered NodeElements
         * or get text html in thier
         *
         * @method attr
         * @param {String} mix QueryString, NodeElement, NodeList
         * @param {String/Object} mix QueryString, NodeElement, NodeList
         * @return {Object/String} Key-value object of attributes or attribute value
         */
        html: function(mix) {
            if (mix === undefined || mix === null) {
                return this[0].innerHTML;
            }

            if (mix.nodeType) {
                this.clear().append(mix);
            } else {
                this.each(function() {
                    while (this.firstChild) {
                        this.removeChild(this.firstChild);
                    }
                    this.insertAdjacentHTML("afterbegin", mix);
                });
            }
            return this;
        },

        append: function(mix) {
            this.each((typeof mix === "string") ?
                function() { this.insertAdjacentHTML("beforeend", mix); } :
                function() { this.appendChild(mix); });
            return this;
        },

        prepend: function(mix) {
            this.each((typeof mix === "string") ?
                function() { this.insertAdjacentHTML("afterbegin", mix); } :
                function() { this.insertBefore(mix, this.firstChild); }
            );
            return this;
        },

        remove: function() {
            this.each(function() {
                this.parentNode.removeChild(this);
            });
            return this;
        },

        clear: function() {
            this.each(function() {
                while (this.firstChild) {
                    this.removeChild(this.firstChild);
                }
            });
            return this;
        },

        replace: function(mix) {
            this.each((typeof mix === "string") ?
                function() { this.insertAdjacentHTML("beforebegin", mix); } :
                function() { this.parentNode.insertBefore(mix, this); });
            this.remove();
            return this;
        },

        css: function(mix, value) {
            var that = this;

            if (typeof mix === "object") {
                tt.each(mix, function(key, val) {
                    if (val === "") {
                        _removeProperty(key);
                        return;
                    }
                    _setStyle(tt.cssCamelizer(key), val);
                });
            } else if (mix) {
                if (value) {
                    _setStyle(tt.cssCamelizer(mix), value);
                } else if (value === "") {
                    _removeProperty(mix);
                } else {
                    return global.getComputedStyle(this[0]).getPropertyValue(mix);
                }
            }

            return this;

            function _removeProperty(prop) {
                that.each(function() {
                    this.style.removeProperty(prop);
                });
            }

            function _setStyle(prop, val) {
                that.each(function() {
                    this.style[prop] = val;
                });
            }
        },

        data: (function() {
            var cond = domTester.dataset,
                _getDataAttr = cond ? _getDataByDataset : _getDataByAttributes,
                _setDataAttr = cond ? _setDataByDataset : _setDataByAttributes;

            return function (mix, value) {
                var that = this,
                    key;

                switch (arguments.length) {
                case 0:
                    return _getDataAttr.call(this);
                case 1:
                    if (typeof mix === "object") {
                        tt.each(mix, function(key, val) {
                            _setDataAttr.call(that, key, val);
                        });
                        return this;
                    } else {
                        return _getDataAttr.call(this, mix);
                    }
                    break;
                case 2:
                    _setDataAttr.call(this, mix, value);
                    return this;
                }
            };

            function _setDataByDataset(key, val) {
                var type = tt.type(val),
                    func = null;

                if (val === "" ||
                    type === "undefined" ||
                    type === "null") {
                        if (this._data[key]) {
                            delete this._data[key];
                            return;
                        } else {
                            func = function() { delete this.dataset[key]; };
                        }
                } else if (type === "string" || type === "number") {
                    func = function() { this.dataset[key] = val; };
                } else {
                    this._data[key] = val;
                    return;
                }
                this.each(func);
            }

            function _getDataByDataset(key) {
                if (!this[0]) {
                    return null;
                }
                var node = this[0],
                    res = {};

                if (key) {
                    if (this._data[key]) {
                        return this._data[key] || null;
                    } else {
                        return node.dataset[key] || null;
                    }
                } else {
                    tt.each(node.dataset, function(key, val) {
                        res[key] = val;
                    });
                    tt.extend(res, this._data);
                }
                return res;
            }

            function _setDataByAttributes(key, val) {
                var type = tt.type(val);

                if (tt.type(val, ["string", "number", "undefined", "null"])) {
                    if (val === "" && this._data[key]) {
                        delete this._data[key];
                        return null;
                    }
                    this.attr("data-" + key, val);
                } else {
                    this._data[key] = val;
                }
            }

            function _getDataByAttributes(key) {
                if (!this[0]) {
                    return null;
                }
                var res = {},
                    dataName = "data-",
                    node = this[0],
                    attr, attrs = node.attributes,
                    i = 0, iz = attrs.length;

                if (!node) {
                    return null;
                } else if (this._data[key]) {
                    return this._data[key];
                } else if (key) {
                    dataName += key;
                    return this.attr(dataName);
                }
                for (; i < iz; ++i) {
                    attr = attrs[i].name;
                    if (attr.indexOf(dataName) > -1) {
                        key = attr.substr(5, attr.length);
                        res[key] = attrs[i].value;
                    }
                }
                tt.each(this._data, function(key, val) {
                    res[key] = val;
                });
                return res;
            }
        })(),

        show: function(value) {
            var currentValue = this.css("display"),
                beforeValue = this._data.beforeDisplay || null;

            if (currentValue !== "none") {
                return;
            }
            return this.css("display", value || beforeValue || "block");
        },

        hide: function() {
            var currentValue = this.css("display");

            if (currentValue !== "none") {
                this._data.beforeDisplay = currentValue;
            }
            return this.css("display", "none");
        },

        trigger: function(event, type, bubbles, cancelable) {
            this.each(function() {
                tt.triggerEvent(this, event, type, bubbles, cancelable);
            });
            return this;
        },

        offset: function() {
            var res = [];

            this.each(function(index) {
                var offset = this.getBoundingClientRect();

                res[index] = {
                    left: offset.left + global.pageXOffset,
                    top: offset.top + global.pageYOffset
                };
            });
            return this.length === 1 ? res[0] : res;
        }
    };

    global[IDENT] = global[IDENT] || tt;


    function _addClassByClassList(className) {
        return this.each(function() {
            this.classList.add(className);
        });
    }

    function _addClassByClassName(className) {
        var stashName = this[0].className,
            newName = _createName(stashName, className);

        return this.each(function(index) {
            if (tt(this).hasClass(className)) {
                return;
            }
            if (index && stashName !== this.className) {
                stashName = this.className;
                newName = _createName(stashName, className);
            }
            this.className = newName;
        });

        function _createName(currentName, newName) {
            var res = currentName.split(" ");

            res[res.length] = newName;
            return res.join(" ");
        }
    }

    function _removeClassByClassList(className) {
        return this.each(function() {
            this.classList.remove(className);
        });
    }

    function _removeClassByClassName(className) {
        className = " " + className + " ";
        return this.each(function() {
            this.className = (" " + this.className + " ").replace(className, "");
        });
    }

    function _hasClassByClassList(className) {
        var res = this.match(function() {
            return this.classList.contains(className);
        });

        return res ? true : false;
    }

    function _hasClassByClassName(className) {
        return this.match(function() {
            return (" " + this.className + " ").indexOf(" " + className + " ") > -1;
        });
    }

})(
    (this.self || global),
    document,
    Array.isArray||(Array.isArray=function(a){return Object.prototype.toString.call(a)==="[object Array]";}),
    function(a) {var b=Object.prototype.toString.call(a);return b==="[object NodeList]"||b==="[object HTMLCollection]";}
);
