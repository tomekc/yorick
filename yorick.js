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

        // all of visibility
        visibilitySwitches;


    function log(msg) {
        if (YORICK_DEBUG && console) {
            var logfunc = Function.prototype.bind.call(console.log, console);
//            console.log(Array.prototype.slice.call(arguments).join(''));
            logfunc.apply(console, arguments);
        }
    }

    function error(msg) {
        if (console) {
            var logfunc = Function.prototype.bind.call(console.error, console);
            logfunc.apply(console, arguments);
        }
    }

    function loadFragment(selector, url, errorHandler) {
        $.ajax({
            url: url,
            type: "GET",
            success: function (data, status, xhr) {
                $(selector).html(data);
            },
            error: function (xhr, errorType, err) {
                error("Cannot load fragment into element ", selector);
                if (typeof(errorHandler) === 'function') {
                    errorHandler();
                }
            },
            beforeSend: function (xhr, settings) {
                // TBI
            }
        });
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
        visibilitySwitches.each(function(i) {
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

        log("Found placeholders ",placeholders);
        log("Found visibility switches ",visibilitySwitches);

        // Clicking on any element with 'data-action' attribute will call
        // function whose name is same as value of attribute
        function complainAboutMissingFunction(functionName, controller) {
            error("No function", functionName+"()", "is defined in controller", controller);
        }

        $("button[data-action]").click(function (e) {
            e.preventDefault();
            var element = $(this);
            var functionName = element.attr("data-action");
            var controller = findController(element);
            if (typeof(window[controller][functionName]) === 'function') {
                window[controller][functionName](element);
                updateAll(window[controller]);
            } else {
                complainAboutMissingFunction(functionName, controller);
            }
        });

        $("select[data-action]").change(function (e) {
            var element = $(this);
            var functionName = element.attr("data-action");
            var controller = findController(element);
            if (typeof(window[controller][functionName]) === 'function') {
                window[controller][functionName](element.val(), element);
                updateAll(window[controller]);
            } else {
                complainAboutMissingFunction(functionName, controller);
            }
        });

        $("input[type=checkbox][data-action]").change(function (e) {
            var element = $(this);
            var functionName = element.attr("data-action");
            var controller = findController(element);
            if (typeof(window[controller][functionName]) === 'function') {
                window[controller][functionName](element.is(":checked"), element);
                updateAll(window[controller]);
            } else {
                complainAboutMissingFunction(functionName, controller);
            }

        });

    });


    return {
        log: log,
        error: error,
        loadFragment: loadFragment
    };

})(detectJqueryishLibrary());
