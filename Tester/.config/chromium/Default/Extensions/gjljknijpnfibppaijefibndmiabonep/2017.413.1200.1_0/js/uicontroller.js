var UICONTROLLER = (function () {
//    var CONFIG = {
//        Debug: 0,
//        Release: 1
//    };
    //var _appConfig = CONFIG.Release; // LAUNCH
    var _sessionTerminationParams = {};
    var _streamingDurationParams = {};
    var _currentSessionId = "";
    var _mainWindowSize = {
        x: 1280,
        y: 720
    };
    var _debugViewSize = {
        x: 425,
        y: 150
    }
    var _launchWindowSize = {
        x: 1280,
        y: 720
    };

    function _onWindowCreated(appwindow) {
        if (!appwindow) {
            return;
        }
        consoleLog("window created. " + appwindow.id);
        appwindow.show();
        if (appwindow.id == "window.html") {
            appwindow.onClosed.addListener(_onWindowClosed);
            return;
        }
    }

    function _createWindow(url, width, height, minWidth, minHeight) {
        var w = width;
        var h = height;
        minWidth = Math.min(minWidth || width, screen.width);
        minHeight = Math.min(minHeight || height, screen.height);
        var left = Math.round((screen.width / 2) - (w / 2));
        var top = Math.round((screen.height / 2) - (h / 2));
        /*Chrome documentation suggests that "bounds" is content bound (which is
        what we need here), not window bound.*/
        var innerbound = {
            width: w,
            height: h,
            minWidth: minWidth,
            minHeight: minHeight,
            left: left,
            top: top,
            id: url,
            hidden: true,
            resizable: true,
            //doesn"t work
        }
        consoleLog("creating a window");

        if(url == "window.html") {
            chrome.storage.local.get("streamerConfig", function (fetchedData) {
                var initParams = {};
                if (fetchedData.streamerConfig) {
                    initParams.serverAddress = fetchedData.streamerConfig.address.concat(":47989");
                } else {
                    initParams.serverAddress = config.proxy+":47989";
                }

                GOOGLEANALYTICS.initialize();
                GRIDBACKGROUNDSERVICE.initialize(initParams);

                chrome.app.window.create(url, innerbound, _onWindowCreated);
            });
        } else {
            chrome.app.window.create(url, innerbound, _onWindowCreated);
        }
    }

    function _onWindowClosed() {
        consoleLog("Streaming window has been closed. Now we should stop the streaming");
        consoleLog("Cleaning up the module");
        GRIDBACKGROUNDSERVICE.cleanup();
    }

    chrome.app.runtime.onLaunched.addListener(function () {
        var allWindows = chrome.app.window.getAll();
        GRIDBACKGROUNDSERVICE.initLogger();
        if (allWindows.length != 0) {
            consoleLog("multiple launch is not allowed, showing current window");
            allWindows[0].show();
            return;
        }
        if (config.appConfig === "DEBUG") {
            _streamingDurationParams = {};
            _sessionTerminationParams = {};
            _createWindow("debuglaunch.html", _debugViewSize.x, _debugViewSize.y);
        } else {
            _createWindow("launch.html", _launchWindowSize.x, _launchWindowSize.y);
        }
    });

    chrome.runtime.onMessage.addListener(function (request, sender, callback) {
        if (request.type == "create_streaming_window") {
            consoleLog("creating streaming window");
            _createWindow("window.html", _mainWindowSize.x, _mainWindowSize.y, _mainWindowSize.x/2, _mainWindowSize.y/2);
        } else if(request.type == "system_info") {
            FEEDBACKSERVICE.updateSystemInfo(request.data);
        } else if(request.type == 'send_feedback') {
            // need to send session id and gamename on both occasion 1) app started from webpage
            // 2) app started from chrome launcher and manually entering the server, session id details.
            chrome.storage.local.get("streamerConfig", function (fetchedData) {
                if (fetchedData.streamerConfig) {
                    request.msg["sessionid"] = fetchedData.streamerConfig.sessionId;
                    FEEDBACKSERVICE.submit(request.msg);
                }
            });
        } else if(request.type == 'send_user_feedback') {
            chrome.storage.local.get("streamerConfig", function (fetchedData) {
                if (fetchedData.streamerConfig) {
                    request.msg["sessionid"] = fetchedData.streamerConfig.sessionId;
                    FEEDBACKSERVICE.submit(request.msg, function() {
                        var allWindows = chrome.app.window.getAll();
                        allWindows[0].close();
                    });
                }
            });
        } else if(request.type == "close_window") {
            console.log("uicontroller::close_window");
            var allWindows = chrome.app.window.getAll();
            allWindows[0].close();
        }
    });
    chrome.runtime.onMessageExternal.addListener(
    function (request, sender, sendResponse) {
        var allWindows = chrome.app.window.getAll();
        if (allWindows.length != 0) {
            // Show current window if the launch request is for the same session id
            if(request.launchApp && request.sessionId && request.sessionId == _currentSessionId) {
                consoleLog("multiple launch is not allowed, showing current window");
                allWindows[0].show();
                return;
            }
        }
        consoleLog(" received a request in the app ");
        if (request.launchApp) {
            GRIDBACKGROUNDSERVICE.initLogger();
            var streamerConfig = {};
            _streamingDurationParams = {};
            _sessionTerminationParams = {};
            consoleLog(" received request is: application launch");
            if (request.sessionId) {
                consoleLog("session id received");
                _currentSessionId = request.sessionId;
                streamerConfig.sessionId = request.sessionId;
            }
            if (request.serverCertificateHash) {
                consoleLog("server certificate hash received");
                streamerConfig.serverCertificateHash = request.serverCertificateHash;
            }
            if (request.fromDisplayName) {
                consoleLog("from display name received");
                streamerConfig.fromDisplayName = request.fromDisplayName;
            }
            if (request.gameTitle) {
                consoleLog("game title name received");
                streamerConfig.gameTitle = request.gameTitle;
            }
            if (request.inviteMode) {
                consoleLog("invite mode received : " + request.inviteMode);
                streamerConfig.inviteMode = request.inviteMode;
            }

            chrome.storage.local.set({
                "streamerConfig": streamerConfig
            });
            if (request.debugView) {
                consoleLog(" received launch request with debug view ");
                chrome.storage.local.set({
                    "streamerConfig": streamerConfig
                });
                _createWindow("debuglaunch.html", _debugViewSize.x, _debugViewSize.y);
            } else if (request.server) {
                request.server = config.proxy;
                consoleLog(" received launch request with server address " + request.server);
                streamerConfig.address = request.server;
                chrome.storage.local.set({
                    "streamerConfig": streamerConfig
                });
                if (allWindows.length != 0) {
                    if (allWindows[0].id == "window.html") {
                    consoleLog("Re-creating Main window");
                    allWindows[0].onClosed.addListener(function(){
                        _createWindow("window.html", _mainWindowSize.x, _mainWindowSize.y);
                    });
                    allWindows[0].close();
                    }
                } else {
                    consoleLog("Creating Main window");
                           _createWindow("window.html", _mainWindowSize.x, _mainWindowSize.y, _mainWindowSize.x/2, _mainWindowSize.y/2);
                }
            }
        }
        sendResponse({
            response: 1
        });
        consoleLog(" sent response to the listener ");
    });
})();


