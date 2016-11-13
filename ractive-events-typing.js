var typingEvent = (function ( global, factory ) {

    "use strict";

    // Common JS (i.e. browserify) environment
    if ( typeof module !== "undefined" && module.exports && typeof require === "function" ) {
        return factory( require( "ractive" ) );
    }

    // AMD?
    else if ( typeof define === "function" && define.amd ) {
        define([ "ractive" ], factory );
    }

    // browser global
    else if ( global.Ractive ) {
        factory( global.Ractive );
    }

    else {
        throw new Error( "Could not find Ractive! It must be loaded before the Ractive-decorators-sortable plugin" );
    }

}( typeof window !== "undefined" ? window : this, function ( Ractive ) {

    "use strict";

    var timer = null;
    var eligibles = ["inputtext", "input", "textareatextarea"];
    var stopped;
    var delay = 500;

    try {
        document.createEvent("TouchEvent");
        delay = 1000;
    } catch (e) {}

    var startedTyping = function (event, fire) {
        var that = this;

        clearTimeout(timer);

        if( stopped === undefined || stopped === true )
        {
            fire({
                node: that,
                original: event,
                typingState: "typing",
                sourceKey: (event.type === "paste") ? "paste" : "typed"
            });
        }

        stopped = false;

        timer = setTimeout(function () {
            // stopped is used to stop continuous fire of state `typing`
            stopped = true;
            fire({
                node: that,
                original: event,
                typingState: "paused"
            });
        }, delay);
    };

    var typedKeys = function (event, fire) {
        // backspace or delete
        if ([8, 46].indexOf(event.keyCode) > -1) {
            startedTyping.call(this, event, fire);
        }
    };

    var stoppedTyping = function (event, fire) {
        if( timer ) {
            clearTimeout(timer);
        }

        fire({
            node: this,
            original: event,
            typingState: "stopped"
        });

        stopped = undefined;
    };

    var beforeTyping = function (event, fire) {
        fire({
            node: this,
            original: event,
            typingState: "beforetyping" // may be, need a good name for this.
        });
    };

    var wrapEvent = function ( func, fire ) {
        return function(event) {
            func.call(this, event, fire);
        };
    };

    var typingFunc = function (node, fire) {

        var tagName = (node.tagName || "");
        var nodeType = (node.type || "");
        var tagAndType = (tagName + nodeType).toLowerCase();
        var contentEditable = typeof node.contentEditable != "undefined";
        var eligibleForTyping = eligibles.indexOf(tagAndType) === 0 || contentEditable;

        var keypress = wrapEvent(startedTyping, fire);
        var blur = wrapEvent(stoppedTyping, fire);
        var focus = wrapEvent(beforeTyping, fire);
        var keydown = wrapEvent(typedKeys, fire);

        if (eligibleForTyping) {
            node.addEventListener("focus", focus);
            node.addEventListener("keypress", keypress);
            node.addEventListener("keydown", keydown);
            node.addEventListener("paste", keypress);
            node.addEventListener("blur", blur);
            // Todo : stoppedTyping when window lose focus, for now getting error from ractive.js (?)
            // window.addEventListener("blur", stoppedTyping);
        }

        return {
            teardown: function () {
                if (eligibleForTyping) {
                    node.removeEventListener("focus", focus);
                    node.removeEventListener("keypress", keypress);
                    node.removeEventListener("keydown", keydown);
                    node.removeEventListener("paste", keypress);
                    node.removeEventListener("blur", blur);
                    // window.removeEventListener("blur", stoppedTyping);
                }
            }
        };
    };

    Ractive.events.typing = typingFunc;

    return typingFunc;
}));

// Common JS (i.e. browserify) environment
if ( typeof module !== "undefined" && module.exports ) {
    module.exports = typingEvent;
}

