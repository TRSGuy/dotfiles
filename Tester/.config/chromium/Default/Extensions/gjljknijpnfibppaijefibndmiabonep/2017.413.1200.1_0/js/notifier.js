var NOTIFIER = (function () {
    var _loaded = false;
    var _preloadQ = [];
    var TYPE_NORMAL = 0;
    var TYPE_FULLSCREEN = 1;

    var DEFAULT_LIFE_MS = 5000;
    var DEFAULT_NORMAL_SPEED_MS = 500;
    var DEFAULT_FULLSCREEN_SPEED_MS = 500;

    /* message // message for notification
     * params = {
     *  lifeMs, // Life of notification (optional - default is DEFAULT_LIFE_MS)
     *  sticky, // Stay on screen until closed (optional - default is false)
     * } (optional)
     */
    function pNotify(message, params) {
        if (params == undefined) {
            params = {};
        }

        if (params.sticky == undefined) {
            params.sticky = false;
        }

        if (params.lifeMs == undefined) {
            params.lifeMs = DEFAULT_LIFE_MS;
        }

        var newParams = {
            life: params.lifeMs,
            /*ms*/
            speed: DEFAULT_NORMAL_SPEED_MS,
            /*ms*/
            theme: "nvgfe",
            sticky: params.sticky,
            horizontalEdge: "right",
            verticalEdge: "top",
            heading: "",
            icon: "img/btn_co_play_green_120x120.png"
        },
            text = message;
        return _queueNotification(text, newParams, TYPE_NORMAL);
    }

    /* message // message for notification
     * params = {
     *  lifeMs, // Life of notification (optional - default is DEFAULT_LIFE_MS)
     *  sticky, // Stay on screen until closed (optional - default is false)
     *  ignoreMouse // Send mouse events to elements behind (optional - default is false)
     * } (optional)
     */
    function pNotifyFullscreen(message, params) {
        if (params == undefined) {
            params = {};
        }

        if (params.lifeMs == undefined) {
            params.lifeMs = DEFAULT_LIFE_MS;
        }

        params.speed = DEFAULT_FULLSCREEN_SPEED_MS;
        return _queueNotification(message, params, TYPE_FULLSCREEN);
    }

    function pClearNotification(notification) {
        if (notification) {
            notification.close();
        }
    }

    function pClearFullscreenNotifications() {
        $(".notifier-fullscreen-notification").remove();
    }

    function _queueNotification(text, params, type) {
        if (_loaded) {
            return _showNotification(text, params, type);
        } else {
            /* queue notification after page load */
            _preloadQ.push({
                text: text,
                params: params,
                type: type
            });
            return {};
        }
    }

    function _showNotification(text, params, type) {
        /* show notification */
        if (type == TYPE_NORMAL) {
            return _showNotificationNormal(text, params);
        } else {
            return _showNotificationFullscreen(text, params);
        }
    }

    function _showNotificationFullscreen(text, params) {
        var notification = $("<div />");
        notification.addClass("notifier-fullscreen-notification");
        notification.fadeIn(params.speed)
                    .appendTo("body");
        if (params.ignoreMouse) {
            notification.css({"pointer-events": "none"});
        }

        var closeFullscreenNotification = function() {
            notification.fadeOut(params.speed, params.onClose);
        }

        if (!params.sticky) {
            notification.delay(params.lifeMs).fadeOut(params.speed, params.onClose);
        } else {
            notification.click(closeFullscreenNotification);
        }
        var textHolder = $("<p />").html(text);
        textHolder.addClass("text");
        textHolder.appendTo(notification);
        return {
            notification: notification,
            close: closeFullscreenNotification
        };
    }

    function _showNotificationNormal(text, params) {
        return $.notific8(text, params);
    }

    function _showPreloadNotifications() {
        for (var i in _preloadQ) {
            _showNotification(_preloadQ[i].text, _preloadQ[i].params, _preloadQ[i].type);
        }
    }

    function _createLinkNode(href) {
        var s = document.createElement("link");
        s.type = "text/css";
        s.rel = "stylesheet";
        s.href = href;
        return s;
    }

    function _createScriptNode(src) {
        var s = document.createElement("script");
        s.type = "text/javascript";
        s.src = src;
        return s;
    }

    function _createDivNode() {
        var d = document.createElement("div");
        return d;
    }

    function _initialize() {
        var h = document.getElementsByTagName("head").item(0);
        h.appendChild(_createLinkNode("js/jquery-notific8/normalize.css"));
        h.appendChild(_createLinkNode("js/jquery-notific8/jquery.notific8.css"));
        var jq = _createScriptNode("js/jquery-notific8/jquery-2.1.1.js");
        jq.onload = function () {
            var nscript = _createScriptNode("js/jquery-notific8/jquery.notific8.js");
            nscript.onload = function () {
                _loaded = true;
                _showPreloadNotifications();
            }
            h.appendChild(nscript);
        }
        h.appendChild(jq);
    }

    document.addEventListener("DOMContentLoaded", function () {
        _initialize();
    });

    return {
        notify: pNotify,
        notifyFullscreen: pNotifyFullscreen,
        clearNotification: pClearNotification,
        clearFullscreenNotifications: pClearFullscreenNotifications
    };
})();
