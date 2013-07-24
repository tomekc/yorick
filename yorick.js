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

var Yorick = (function ($) {

    var
    // array of all placeholders in DOM
        placeholders,

    // all visibility attributes in DOM
        visibilitySwitches;


    function log(msg) {
        if (YORICK_DEBUG && console) {
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

    function AjaxPromise() {
        var successFunction,
            errorFunction,
            successValue = false,
            errorValue = false;

        function callSuccess() {
            successFunction();
        }

        this.success = function(callback) {
            successFunction = callback;
            log("Set success callback in Promise: ",successFunction)
            if (successValue) {
                callSuccess();
            }
            return this;
        }

        this.resolveSuccess = function() {
            successValue = true;
            if (successFunction !== undefined) {
                callSuccess();
            }
        }

        this.error = function(callback) {
            errorFunction = callback;
            if (this.sucessValue && errorFuction !== undefined) {
                errorFunction();
            }
            return this;
        }

        this.resolveError = function() {
            errorValue = true;
            if (errorFuction !== undefined) {
                errorFunction();
            }
        }
        
        
    }

    function loadFragment(selector, url, errorHandler) {
        var promise = new AjaxPromise();
        $.ajax({
            url: url,
            type: "GET",
            success: function (data, status, xhr) {
                $(selector).html(data);
                promise.resolveSuccess();
            },
            error: function (xhr, errorType, err) {
                error("Cannot load fragment into element ", selector);
                promise.resolveError();
                if (typeof(errorHandler) === 'function') {
                    errorHandler();
                }
            },
            beforeSend: function (xhr, settings) {
                // TBI
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
        }
    }

    // === Startup ===
    log("Hello, it's Yorick 1.0");
    if ($ === null) {
        error("No jQuery-ish library found. Please add jQuery or Zepto to scripts.");
        return {};
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

    $(function () {
        placeholders = $("[data-value]");
        visibilitySwitches = $('[data-visible]');

        log("Found placeholders ", placeholders);
        log("Found visibility switches ", visibilitySwitches);

        // Clicking on any element with 'data-action' attribute will call
        // function whose name is same as value of attribute
        function complainAboutMissingFunction(functionName, controller) {
            error("No function", functionName + "()", "is defined in controller", controller);
        }


        function callControllerFunction(element, params) {
            var functionName = element.attr("data-action");
            var controller = findController(element);
            if (typeof(window[controller][functionName]) === 'function') {
                window[controller][functionName].apply(window[controller], params); // (element);
                updateAll(window[controller]);
            } else {
                complainAboutMissingFunction(functionName, controller);
            }
        }

        $("button[data-action], a[data-action]").click(function (e) {
            e.preventDefault();
            var element = $(this);
            callControllerFunction(element, [element]);
        });

        $("select[data-action]").change(function (e) {
            var element = $(this);
            callControllerFunction(element, [element.val(), element]);
        });

        $("input[type=checkbox][data-action]").change(function (e) {
            var element = $(this);
            callControllerFunction(element, [element.is(":checked"), element]);
        });

    });


    return {
        log: log,
        error: error,
        loadFragment: loadFragment,
        hash: hash,
        updateAll: updateAll
    };

})(detectJqueryishLibrary());
