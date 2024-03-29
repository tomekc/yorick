/**
 * Yorick - minimalist JavaScript framework.
 *
 * Call it "jQuery Boilerplate" or "Poor Man's Angular.js"
 *
 * Copyright (C) 2013 Tomek Cejner tomek@japko.info
 *
 * Distributed under Apache License
 *
 */
function detectJqueryishLibrary() {
    if (typeof(jQuery) === "function") {
        return jQuery;
    } else if (typeof(Zepto) === "function") {
        return Zepto;
    } else if (typeof($) === 'function' && typeof($('*')) === 'function') {
        // detected something jQuer-ish
        return $;
    } else {
        return null;
    }
}

var YORICK_VERSION = "1.0.RC1";

(function ($) {
    var
        placeholders,           // array of all placeholders in DOM
        visibilitySwitches,     // all visibility attributes in DOM
        controllers,            // all controllers
        scopes = {}             // $scopes of controllers
        ;

    // safe wrapper around console.log
    function log(msg) {
        if (window.YORICK_DEBUG && console) {
            var logfunc = Function.prototype.bind.call(console.log, console);
            logfunc.apply(console, arguments);
        }
    }

    function error(msg) {
        if (console) {
            var logfunc = Function.prototype.bind.call(console.error, console);
            logfunc.apply(console, arguments);
        }
    }

    function AjaxPromise(after) {
        var successFunction,
            errorFunction,
            successValue = false,
            errorValue = false;

        function invokePromisedFunction(what) {
            if (what === undefined) {
                return;
            }
            what();
            if (after !== undefined && typeof(after) === 'function') {
                after();
            }
        }

        this.success = function (callback) {
            successFunction = callback;
            if (successValue) {
                invokePromisedFunction(successFunction);
            }
            return this;
        };

        this.resolveSuccess = function () {
            successValue = true;
            invokePromisedFunction(successFunction);
        };

        this.error = function (callback) {
            errorFunction = callback;
            if (errorValue) {
                invokePromisedFunction(errorFunction);
            }
            return this;
        };

        this.resolveError = function () {
            errorValue = true;
            invokePromisedFunction(errorFunction);
        };
    }

    function loadFragment(selector, url, apromise) {
        var promise = apromise || new AjaxPromise();
        $.ajax({
            url: url,
            type: "GET",
            success: function (data, status, xhr) {
                $(selector).html(data);
                promise.resolveSuccess();
            },
            error: function (xhr, errorType, err) {
                error("Cannot load fragment from url", url, "into element", selector);
                promise.resolveError();
            }
        });
        return promise;
    }

    function hash(key, value) {
        var pairs = window.location.hash.slice(1).split(",");
        var hashData = {};
        for (var i = 0; i < pairs.length; i++) {
            var keyval = pairs[i].split("=");
            if (keyval.length == 2) {
                hashData[keyval[0]] = keyval[1];
            }
        }
        if (value === undefined) {  // so it is read
            return hashData[key];
        } else {
            hashData[key] = value;
            // assemble location hash
            pairs = [];
            for (var k in hashData) {
                if (hashData.hasOwnProperty(k)) {
                    pairs.push(k + "=" + hashData[k]);
                }
            }
            window.location.hash = pairs.join(",");
            return value;
        }
    }

    function findController(element) {
        var parents = element.parents("[data-controller]");
        if (parents.length < 1) {
            error("No controller found, add data-action attribute to any enclosing element.");
            return null;
        }
        return $(parents[0]).attr("data-controller");
    }

    // iterate thru found placeholders and apply existing values
    function updatePlaceholders(obj) {
        placeholders.each(function (i) {
            var name = $(this).attr("data-value");
            if (obj.hasOwnProperty(name)) {
                var value = obj[name];
                if (typeof(value) === "number" || typeof(value) === "string") {
                    $(this).html(value);
                }
            }
        });
    }

    function updateVisibility(obj) {
        visibilitySwitches.each(function (i) {
            var name = $(this).attr("data-visible");
            if (obj.hasOwnProperty(name)) {
                var value = obj[name];
                if (typeof(value) === "number" || typeof(value) === "string" || typeof(value) === 'boolean') {
                    if (value) {
                        $(this).show();
                    } else {
                        $(this).hide();
                    }
                }
            }
        });
    }

    function updateAll(obj) {
        updatePlaceholders(obj);
        updateVisibility(obj);
    }

    // === Startup ===
    log("Hello, it's Yorick", YORICK_VERSION);
    if ($ === null) {
        error("No jQuery-ish library found. Please add jQuery or Zepto to scripts.");
        return {};
    }

    $(function () {
        placeholders = $("[data-value]");
        visibilitySwitches = $('[data-visible]');
        controllers = $('[data-controller]');

        // find all controllers
        controllers.each(function (i) {
            var name = $(this).attr("data-controller");
            if (typeof(window[name]) === 'function') {
                scopes[name] = {};

                var ymethods = {
                    log: log,
                    error: error,
                    loadFragment: function (selector, url) {
                        var after = function () {
                            updateAll(scopes[name]);
                        };
                        return loadFragment(selector, url, new AjaxPromise(after));
                    },
                    hash: hash,
                    updateAll: function() {
                        updateAll(scopes[name]);
                    }
                };

                // call controller function
                window[name](scopes[name], ymethods);
                // update all placeholders after
                updateAll(scopes[name]);
            }
        });

        // Clicking on any element with 'data-action' attribute will call
        // function whose name is same as value of attribute
        function complainAboutMissingFunction(functionName, controller) {
            error("No function", functionName + "()", "is defined in controller", controller);
        }


        function callControllerFunction(element, params) {
            var functionName = element.attr("data-action");
            var controller = findController(element);
            if (typeof(scopes[controller][functionName]) === 'function') {
                scopes[controller][functionName].apply(window[controller], params); // (element);
                updateAll(scopes[controller]);
            } else {
                complainAboutMissingFunction(functionName, controller);
            }
        }

        $("button[data-action], a[data-action]").click(function (e) {
            e.preventDefault();
            var element = $(this);
            callControllerFunction(element, [element]);
        });

        $("select[data-action]").change(function () {
            var element = $(this);
            callControllerFunction(element, [element.val(), element]);
        });

        $("input[type=checkbox][data-action]").change(function () {
            var element = $(this);
            callControllerFunction(element, [element.is(":checked"), element]);
        });

        $(window).on('hashchange', function() {
            log("Hash changed to",window.location.hash);
        });

    });
})(detectJqueryishLibrary());
