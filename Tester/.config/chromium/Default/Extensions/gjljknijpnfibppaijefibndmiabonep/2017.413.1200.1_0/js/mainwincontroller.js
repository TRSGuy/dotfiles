var CONTROLLER_MAPPING = {
    Blocked: 0,
    Mirrored: 1,
    Exclusive_LocalPriority: 2
};

var MAINWINCONTROLLER = (function () {
    var COPLAY_APPID = 21846;
    var COPLAY_PORT = 443;
    var COPLAY_XRES = 1280;
    var COPLAY_YRES = 720;
    var COPLAY_FRAMERATE = 30;
    var COPLAY_BITRATE = 5;
    var PAUSE_FADE_SPEED_MS = 100;
    var MAIN_DISPLAY_MODES = {
        load: 0,
        play: 1,
        pause: 2,
        stop: 3,
        eula: 4,
        stopOnError: 5,
        pauseOnNetworkError: 6
    };
    var IMAGE_LOAD_PATH = "img/splash_loader.gif";
    var IMAGE_PAUSE_PATH = "img/pause.png";
    var _logArray = [];
    var _filesystem;
    var _keysDown = {};
    var _messageText;
    var _messageTitle;
    var _messageDiv;
    var _pauseContainer;
    var _messagePauseImg;
    var _pauseText;
    var _messageLogoImg;
    var _messageButton;
    var _clientDiv;
    var _gridPlugin;
    var _uiConfig;
    var _streamerConfig;
    var _stringReplaceMap;
    var _mainDisplayMode;
    var _isMouseLocked;
    var _clickToPlayNotification;
    var _leavePlayNotification;
    var _micOn;
    var _osc;
    var _feedback;
    var _stringSuffix;
    var _persistentStorageSize;
    var _userid;
    var _install = false;
    var _eulaDiv;
    var _eulaAccepted;
    var _controllerMapping = CONTROLLER_MAPPING.Blocked;
    var _showOscOnControllerMappingChanged = false;
    var _notification;
    var _countSummaryStat = 0;
    var MAX_RECONNECT_TIME_ALLOWED = 3 * 60 * 1000; // 3 mins.
    var _reconnectStartTime = 0;

    var _listener = {
        onLoadEvent: _GRIDOnLoadEvent,
        onQueuePositionChanged: _GRIDOnQueuePositionChanged,
        onStreamEvent: _GRIDOnStreamEvent,
        onInitialized: _GRIDOnInitialized,
        onLog: _GRIDOnLog,
        onException: _GRIDOnException
    }

    var _loopAnimation = function (image, type) {
        var _boolDecrement = true;
        var _numOpacity = 100;
        var _interval;
        var _types = {
            fade: _fade
        }

        function _fade() {
            _boolDecrement = (_numOpacity == 0) ? false : (_numOpacity == 100) ? true : _boolDecrement;
            _numOpacity = _boolDecrement ? (_numOpacity -= 10) : (_numOpacity += 10);
            image.style.opacity = (_numOpacity / 100);
        }

        function pStart(intervalMs) {
            _log("starting animation " + image);
            image.style.visibility = "visible";
            if (_types[type]) {
                _interval = setInterval(_types[type], intervalMs);
            }
        }

        function pStop() {
            image.style.visibility = "hidden";
            clearInterval(_interval);
        }
        return {
            start: pStart,
            stop: pStop
        }
    };
    var _pauseAnimation;
    var _crashHandled = false;

    function _getRandomToken() {
        // E.g. 8 * 32 = 256 bits token
        var randomPool = new Uint8Array(32);
        crypto.getRandomValues(randomPool);
        var hex = '';
        for (var i = 0; i < randomPool.length; ++i) {
            hex += randomPool[i].toString(16);
        }
        // E.g. db18458e2782b2b77e36769c569e263a53885a9944dd0a861e5064eac16f1a
        return hex;
    }

    function _sendUserIdToBackgroundScript() {
        // send the user id to background thread. This user id will be sent to GoogleAnalytics.
        chrome.runtime.sendMessage({
            type: 'user_id',
            msg: _userid
        });
    }

    function _onInitFs(fs) {
        _filesystem = fs;
        _log("JS Filesystem named " + _filesystem.name + " acquired.");
        _filesystem.root.getFile('userid.csv', {}, function (fileEntry) {
            fileEntry.file(function (file) {
                var reader = new FileReader();
                reader.onloadend = function (e) {
                    _userid = this.result;
                    _log("UserID : " + _userid);
                    _sendUserIdToBackgroundScript();
                    _initialize();
                };
                reader.readAsText(file);
            }, function () {
                _log("userid.csv read file error");
            });
        }, function () {
            // Create the file
            _filesystem.root.getFile('userid.csv', {create: true}, function (fileEntry) {
                fileEntry.createWriter(function (fileWriter) {
                    fileWriter.onwriteend = function (e) {
                        _log('userid.csv write completed.');
                    };
                    fileWriter.onerror = function (e) {
                        _log('userid.csv write failed: ' + e.toString());
                    };
                    _userid = _getRandomToken();
                    _sendUserIdToBackgroundScript();
                    var blob = new Blob([_userid], {type: 'text/plain'});
                    fileWriter.write(blob);
                    _install = true;
                    _initialize();
                }, function () {
                    _log("Error in creating UserID file 1");
                });
            }, function () {
                _log("Error in creating UserID file 2");
            });
        });
    }
    function _initializeFs() {
        // Request persistent storage.  If fail, continue to init
        // this needs to be done before initializing the module
        // We request arbitrary size of 30Mb
        navigator.webkitPersistentStorage.requestQuota(30 * 1024 * 1024, function (grantedBytes) {
            _log("PERSISTENT STORAGE granted: " + grantedBytes + " bytes");
            _persistentStorageSize = grantedBytes;

            // request the filesystem in JavaScript as well
            window.webkitRequestFileSystem(window.PERSISTENT, grantedBytes, _onInitFs, function (e) {
                _log("ERROR Requesting Filesystem: " + e);
            });
        }, function (e) {
            _log("PERSISTENT STORAGE: ERROR: " + e);
            _persistentStorageSize = 0;
        });
    }

    function _initializeGRID(streamerConfig) {

        // continue to initialize
        GRID.initialize(_gridPlugin, streamerConfig);
        _gridPlugin.focus();
    }

    function _onGridPepperLoaded() {
        _log("onGridPepperLoaded");
        chrome.storage.local.get("streamerConfig", function (fetchedData) {
            if (fetchedData.streamerConfig) {
                _streamerConfig = fetchedData.streamerConfig;

                var defaultConfig = GRID.defaultStreamerConfig();
                for (var each in _streamerConfig) {
                    if (!_streamerConfig.hasOwnProperty(each)) {
                        continue;
                    }
                    if (PARAMMAP.get(each)) {
                        _streamerConfig[PARAMMAP.get(each)] = _streamerConfig[each];
                    }
                }

                for (var each in defaultConfig) {
                    if (!defaultConfig.hasOwnProperty(each)) {
                        continue;
                    }
                    if (!_streamerConfig[each]) {
                        _streamerConfig[each] = defaultConfig[each];
                    }
                }
                _streamerConfig.appid = COPLAY_APPID;
                _streamerConfig.port = COPLAY_PORT;
                _streamerConfig.xres = COPLAY_XRES;
                _streamerConfig.yres = COPLAY_YRES;
                _streamerConfig.framerate = COPLAY_FRAMERATE;
                _streamerConfig.bitrate = COPLAY_BITRATE;
                _stringSuffix = _streamerConfig.inviteMode == 'email' ? '' : 'nodisplayname';
                _streamerConfig.googleanalyticstracking = true; //whether to allow google analytics tracking

                _log("streamerConfig address: " + _streamerConfig.address);
                if (_streamerConfig.address.search("gs://") == 0) {
                    _streamerConfig.address = _streamerConfig.address.concat(":47989");
                }

                if ((_streamerConfig.sessionid == "") || (_streamerConfig.sessionid == undefined)) {
                    _messageText.innerHTML = STRINGS.get("invalid_sessionid");
                    _messageText.style.visibility = "visible";
                } else {
                    _streamerConfig.authtype = "sessionid";
                    _streamerConfig.persistentstoragesize = _persistentStorageSize;
                    _streamerConfig.userid = _userid;
                    _streamerConfig.newinstall = _install;
                    _initializeGRID(_streamerConfig);

                    _uiConfig = (function () {
                        var _config = _streamerConfig;
                        return {
                            get: function (key) {
                                if (_config[key]) {
                                    return _config[key];
                                }
                                return "";
                            }
                        }
                    })();
                }
                _stringReplaceMap = {
                    fromDisplayName: _uiConfig.get("fromDisplayName"),
                    gameTitle: _uiConfig.get("gameTitle")
                }
            } else {
                _messageText.innerHTML = STRINGS.get("no_streamer_config");
                _messageText.style.visibility = "visible";
            }
        });
    }

    function pToggleFullscreen() {
        var elem = document.getElementById("listener");
        var tile = document.getElementById("fullscreenTile");
        var tileImg = document.getElementById("fullscreenImage");
        if (document.webkitIsFullScreen) {
            if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
                _log("Exiting Fullscreen");
                tileImg.src = "img/fullscreen_icon48.png";

            } else {
                _log("No ExitFullscreen support");
            }
        } else {
            if (elem && elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen(elem.ALLOW_KEYBOARD_INPUT);
                _log("Going Fullscreen");
                tileImg.src = "img/not_fullscreen_icon48.png";
            } else {
                _log("No fullscreen support");
            }
        }
    }

    function pToggleMouseLock() {
        GRID.controlInputEvents(!_isMouseLocked, !_isMouseLocked);
    }

    function pToggleMic() {
        _setMicOn(!_micOn, true);
    }

    function _setMicOn(on) {
        var micImg = document.getElementById("micImage");
        _micOn = on;
        if (on) {
            micImg.src = "img/lg_mic_always_on_48x48.png";
            OSD.show();
        } else {
            micImg.src = "img/lg_mic_off_48x48.png";
            OSD.hide();
        }

        // WebRTC
        muteMicrophone(!_micOn);
    }

    function _setAudioChatOutputOn(on) {
        muteRemoteAudio(!on);
    }

    function _setMainDisplayMode(mode) {

        _pauseAnimation.stop();
        if (mode == MAIN_DISPLAY_MODES.load) {
            _clientDiv.style.visibility = "hidden";
            _messageDiv.style.visibility = "visible";
            _messageLogoImg.style.display = "block";
            _messageText.style.display = "block";
            _messageTitle.style.display = "block";
            _hideFeedbackDisplay();
        } else if (mode == MAIN_DISPLAY_MODES.play) {
            _clientDiv.style.visibility = "visible";
            _messageDiv.style.visibility = "hidden";
        } else if (mode == MAIN_DISPLAY_MODES.pause) {
            _clientDiv.style.visibility = "hidden";
            _messageDiv.style.visibility = "visible";
            _messageLogoImg.style.display = "none";
            _messageText.style.display = "none";
            _messageTitle.style.display = "none";
            _pauseAnimation.start(PAUSE_FADE_SPEED_MS);
            _pauseText.style.visibility = "hidden";
        } else if (mode == MAIN_DISPLAY_MODES.stop) {
            _hideOsc();
            OSD.hideAll();
            _clientDiv.style.visibility = "hidden";
            _pauseContainer.style.visibility = "hidden";
            _pauseText.style.visibility = "hidden";
            _messageLogoImg.style.display = "block";
            _messageTitle.innerHTML = STRINGS.get("stopTitle");
            _messageText.style.display = "block";
            _messageTitle.style.display = "block";
            _messageDiv.style.visibility = "visible";
            _messageTitle.style.visibility = "visible";
            _messageText.style.visibility = "visible";
            document.getElementById("messageButton").value = chrome.i18n.getMessage("send_feedback");
            _messageButton.style.visibility = "visible";
            $("#messageButton").unbind('click').click(function () {
                _messageDiv.style.visibility = "hidden";
                _showFeedbackDisplay();
            });
        } else if (mode == MAIN_DISPLAY_MODES.stopOnError) {
            _hideOsc();
            OSD.hideAll();
            _clientDiv.style.visibility = "hidden";
            _pauseContainer.style.visibility = "hidden";
            _pauseText.style.visibility = "hidden";
            _messageLogoImg.style.display = "block";
            _messageText.style.display = "block";
            _messageTitle.style.display = "block";
            _messageDiv.style.visibility = "visible";
            _messageTitle.style.visibility = "visible";
            _messageText.style.visibility = "visible";
            document.getElementById("messageButton").value = chrome.i18n.getMessage("troubleshooting_guide");
            _messageButton.style.visibility = "visible";
            $("#messageButton").unbind('click').click(function () {
                var a = document.createElement('a');
                a.href = 'http://www.nvidia.com/content/drivers/redirect.asp?language=enu&page=osc_tsguide';
                a.target='_blank';
                a.click();
            });
        } else if (mode == MAIN_DISPLAY_MODES.eula) {
            _clientDiv.style.visibility = "hidden";
            _messageDiv.style.visibility = "hidden";
            _messageLogoImg.style.display = "none";
            _messageText.style.display = "none";
            _messageTitle.style.display = "none";
        } else if (mode == MAIN_DISPLAY_MODES.pauseOnNetworkError) {
            _clientDiv.style.visibility = "hidden";
            _messageDiv.style.visibility = "visible";
            _messageLogoImg.style.display = "none";
            _messageText.style.display = "none";
            _messageTitle.style.display = "none";
            _pauseAnimation.start(PAUSE_FADE_SPEED_MS);
            _pauseText.style.display = "block";
            _pauseText.style.visibility = "visible";
        }
        _mainDisplayMode = mode;
        return true;
    }

    function _setControllerMapping(mode) {
        if (mode != _controllerMapping) {
            _showOscOnControllerMappingChanged = true;
        }
        if (mode == "nvb_controller_mapping_client_blocked") {
            _controllerMapping = CONTROLLER_MAPPING.Blocked;
            GRID.controlInputEvents(false, false);
        } else if (mode == "nvb_controller_mapping_client_server_mirrored") {
            _controllerMapping = CONTROLLER_MAPPING.Mirrored;
        } else if (mode == "nvb_controller_mapping_client_priority" ||
                   mode == "nvb_controller_mapping_server_priority") {
            _controllerMapping = CONTROLLER_MAPPING.Exclusive_LocalPriority;
        }
        OSC.setControllerMode(_controllerMapping);
    }

    function pGetControllerMapping() {
        return _controllerMapping;
    }

    function _onMouseLockChanged(mouseLocked) {
        _log("mouse lock changed: " + mouseLocked);
        _isMouseLocked = mouseLocked;
        if (!_isMouseLocked) {
            chrome.app.window.current().focus();
        }
        if (_isMouseLocked) {
            _gridPlugin.focus();
            _hideOsc();
        } else if (_mainDisplayMode == MAIN_DISPLAY_MODES.play) {
            _showOsc();
        }
    }

    var oscDismiss = false;
    function _onKeyDown(event) {
        if (event.altKey && event.keyCode == 88) { // Alt + x
            event.preventDefault();
            event.stopPropagation();
            if (!_feedback) {
                pToggleMiniOsc();
            }
        } else if (event.keyCode == 27) {  // Esc
            if (_osc) {
                event.preventDefault();
                event.stopPropagation();
                pToggleMiniOsc();
                oscDismiss = true;
            } else if(_feedback) { // Esc on feedback UI
                event.preventDefault();
                event.stopPropagation();
                FEEDBACK.skip();
            }
        } else if (event.keyCode == 122) { // F11
            event.preventDefault();
            event.stopPropagation();
            pToggleFullscreen();
        } else if (event.altKey && event.keyCode == 13) { // Alt + Enter
            event.preventDefault();
            event.stopPropagation();
            pToggleFullscreen();
        } else if (event.ctrlKey && event.keyCode == 20) { // Ctrl + CAPS
            event.preventDefault();
            event.stopPropagation();
            _saveLog();
        } else if (event.ctrlKey && event.altKey && event.keyCode == 68) { // Ctrl + ALT + D
            event.preventDefault();
            event.stopPropagation();
            ONSCREENSTATS.toggleVisibility();
        } else if (event.altKey && event.keyCode == 77) { // Alt + M
            event.preventDefault();
            event.stopPropagation();
            pToggleMic();
        }  else if (event.shiftKey && event.keyCode == 9) { // SHIFT + TAB
            // block Steam HotKey
            event.preventDefault();
            event.stopPropagation();
        }  else if (event.shiftKey && event.keyCode == 112) { // SHIFT + F1
            // block Origin Overlay HotKey
            event.preventDefault();
            event.stopPropagation();
        }  else if (event.shiftKey && event.keyCode == 113) { // SHIFT + F2
            // block UPlay(Ubisoft) Overlay HotKey
            event.preventDefault();
            event.stopPropagation();
        }  else if (event.altKey && event.keyCode == 115) { // Alt + f4
            event.preventDefault();
            event.stopPropagation();
            chrome.runtime.sendMessage({type:'close_window'});
        }
    }

    function _onKeyUp(event) {
        if ((event.altKey && event.keyCode == 88) // Alt + x
            || (event.altKey && event.keyCode == 77) // Alt + M
            || ((event.keyCode == 27) && (oscDismiss == true)) // Esc and osc was dismissed on keydown
            || ((event.keyCode == 27) && (_feedback == true)) // Esc on feedback UI
        ) {
            event.preventDefault();
            oscDismiss = false;
        }
    }

    function _onMouseClick(event) {
        if ((_mainDisplayMode == MAIN_DISPLAY_MODES.play) &&
            (!_isMouseLocked) &&
            (_controllerMapping != CONTROLLER_MAPPING.Blocked)) {
            GRID.controlInputEvents(true, true);
        }
    }

    function _GRIDOnLoadEvent(event) {
            _messageTitle.innerHTML = STRINGS.get("title");
        if (event.localeCompare("playing") == 0) {
            _log("load event: " + event);
            _messageText.innerHTML = STRINGS.getWithReplace("playing"+_stringSuffix, _stringReplaceMap);
            _setMainDisplayMode(MAIN_DISPLAY_MODES.play);
            _showOsc();
            OSC.setControllerMode(_controllerMapping);
        } else if (event.localeCompare("connecting") == 0) {
            _messageText.innerHTML = STRINGS.getWithReplace("connecting"+_stringSuffix, _stringReplaceMap, "");
        } else if (event.localeCompare("configuring") == 0) {
            _messageText.innerHTML = STRINGS.getWithReplace("configuring"+_stringSuffix, _stringReplaceMap, "");
        } else if (event.localeCompare("gameseatready") == 0) {
            _messageText.innerHTML = STRINGS.getWithReplace("gameseatready"+_stringSuffix, _stringReplaceMap, "");
        }
    }

    function _GRIDOnQueuePositionChanged(queuePosition) {
        _messageText.innerHTML = STRINGS.get("queueposition") + position;
        _messageText.style.visibility = "visible";
    }

    function _allowReconnect() {
        // To reconnect we should have received at least seen one second of video  _countSummaryStat > 0
        // And if we have started reconnection process, we should allow reconnection until MAX_RECONNECT_TIME_ALLOWED
        var bReconnect = false;
        if( _countSummaryStat > 0 ) {
            if( _reconnectStartTime ) {
                var currentTime = new Date();
                _log("Reconnect start time: " + _reconnectStartTime + " current time: " + currentTime + " diff: " + (currentTime - _reconnectStartTime));
                if( ( currentTime - _reconnectStartTime) <  MAX_RECONNECT_TIME_ALLOWED ) {
                    bReconnect = true;
                }
            } else {
                bReconnect = true;
                _log("Reconnect not in progress.");
            }
        }
        return bReconnect;
    }

    function _GRIDOnStreamEvent(jsonobj) {
        var sendErrorFeedback = false;
        var feedbackdata = {
            "errorupload" : true,
        };

        var event = jsonobj.streamevent;
        var eventdata = jsonobj.eventdata;
        var extendederrordetail = jsonobj.extendederrordetail;

        //console.log("StreamEvent: " + event + " " + eventdata + " " + extendederrordetail);
        if (event == "nvb_evt_streaming_server_pause") {
            if (_setMainDisplayMode(MAIN_DISPLAY_MODES.pause)) {
                _notification = NOTIFIER.notify(STRINGS.getWithReplace("notification_paused"+_stringSuffix, _stringReplaceMap, extendederrordetail));
                _hideOsc();
            }
        } else if (event == "nvb_evt_streaming_server_resume") {
            if (_setMainDisplayMode(MAIN_DISPLAY_MODES.play)) {
                NOTIFIER.clearNotification(_notification);
                // Show OSC only if host has changed controller mapping while in pause
                if (_showOscOnControllerMappingChanged) {
                    _showOsc();
                    _showOscOnControllerMappingChanged = false;
                } else {
                    _gridPlugin.focus();
                }
            }
        } else if (event == "mouse_lock_changed") {
            _onMouseLockChanged(eventdata);
        } else if (event == "nvb_evt_game_connected") {
            /* Ignore */
        } else if (event == "gamepad_state_changed") {
            /* Ignore */
        } else if (event == "nvb_evt_streaming_properties") {
            _messageTitle.innerHTML = STRINGS.get("title");
            _messageText.innerHTML = STRINGS.getWithReplace(event+_stringSuffix, _stringReplaceMap, extendederrordetail);
            _messageText.style.visibility = "visible";
            // Unmute the audio chat
            _log("Gamestream connected. Unmuting audio chat");
            _setAudioChatOutputOn(true);
            _setMicOn(true);
        } else if (event == "nvb_evt_streaming_quality_changed") {
            ONSCREENSTATS.updateStats({streamingQuality: eventdata});
            OSD.updateStreamingQuality(parseInt(eventdata, 10));
        } else if (event == "nvb_summary_stats") {
            _countSummaryStat++;
            _reconnectStartTime = 0;
            ONSCREENSTATS.updateStats(jsonobj);
        } else if (event == "nvb_evt_controller_mapping_changed") {
            _setControllerMapping(eventdata);
        } else if (event == "nvb_evt_session_expired") {
            _messageTitle.innerHTML = STRINGS.get("stopTitle");
            _messageText.innerHTML = STRINGS.getWithReplace(event, _stringReplaceMap, extendederrordetail);
            _setMainDisplayMode(MAIN_DISPLAY_MODES.stop);
            GRID.stop();
        } else if (event == "nvb_evt_game_exited_by_user") {
            _messageTitle.innerHTML = STRINGS.get("stopTitle");
            _messageText.innerHTML = STRINGS.getWithReplace(event+_stringSuffix, _stringReplaceMap, extendederrordetail);
            _setMainDisplayMode(MAIN_DISPLAY_MODES.stop);
            GRID.stop();
        } else if (event.localeCompare("stopping") == 0) {
            _hideOsc();
            _clientDiv.style.visibility = "hidden";
            _pauseContainer.style.visibility = "hidden";
            _messageLogoImg.style.display = "block";
            _messageTitle.style.display = "block";
            _messageDiv.style.visibility = "visible";
            _messageTitle.style.visibility = "visible";
            _messageText.style.visibility = "hidden";
            _messageTitle.innerHTML = STRINGS.getWithReplace("stopping", _stringReplaceMap, extendederrordetail);
        } else {
            _log("_GRIDOnStreamEvent: Something unexpected happened: " + JSON.stringify(jsonobj));
            _log("The event that caused this is " + event + " " + eventdata + " " +  extendederrordetail);
            var bStopSession = true;
            if (event == "nvb_initialize_failed") {
                _messageTitle.innerHTML = STRINGS.get("errorTitle");
                _messageText.innerHTML = STRINGS.getWithReplace(eventdata, _stringReplaceMap, extendederrordetail);
                _setMainDisplayMode(MAIN_DISPLAY_MODES.stopOnError);

                // send "ERROR_STREAM_INIT" feedback.
                sendErrorFeedback = true;
                feedbackdata["errorcategory"] = "ERROR_STREAM_INIT";
                feedbackdata["errorstring"] = eventdata;
                if (extendederrordetail) {
                    feedbackdata["errorcode"] = extendederrordetail;
                }
            } else if (event == "nvb_evt_game_start_failed") {
                if ( (eventdata == "nvb_r_network_error") && _allowReconnect()) {
                    // Attempt to reconnect
                    if( !_reconnectStartTime ) {
                        _reconnectStartTime = new Date();
                    }
                    _setMainDisplayMode(MAIN_DISPLAY_MODES.pauseOnNetworkError);
                    bStopSession = false;
                    GRID.reconnect();
                } else {
                    if (eventdata == "nvb_r_server_upgrade_required") {
                        _messageTitle.innerHTML = STRINGS.get("stopTitle");
                        _messageText.innerHTML = STRINGS.getWithReplace(eventdata+_stringSuffix, _stringReplaceMap, extendederrordetail);
                    } else if (eventdata == "nvb_r_client_upgrade_required") {
                        _messageTitle.innerHTML = STRINGS.get("stopTitle");
                        _messageText.innerHTML = STRINGS.getWithReplace(eventdata+_stringSuffix, _stringReplaceMap, extendederrordetail);
                    } else if (eventdata == "nvb_r_no_session_to_resume") {
                        _messageTitle.innerHTML = STRINGS.get("stopTitle");
                        _messageText.innerHTML = STRINGS.getWithReplace(eventdata+_stringSuffix, _stringReplaceMap, extendederrordetail);
                    } else if (eventdata == "nvb_r_server_out_of_service") {
                        _messageTitle.innerHTML = STRINGS.get("errorTitle");
                        _messageText.innerHTML = STRINGS.getWithReplace(eventdata, _stringReplaceMap, extendederrordetail);
                    } else if (eventdata == "nvb_r_session_no_longer_active") {
                        _messageTitle.innerHTML = STRINGS.get("stopTitle");
                        _messageText.innerHTML = STRINGS.getWithReplace(eventdata+_stringSuffix, _stringReplaceMap, extendederrordetail);
                    } else if (eventdata == "nvb_r_streamer_connect_failed") {
                        _messageTitle.innerHTML = STRINGS.get("errorTitle");
                        _messageText.innerHTML = STRINGS.getWithReplace(eventdata, _stringReplaceMap, extendederrordetail);
                    } else if (eventdata == "nvb_r_network_error") {
                        _reconnectStartTime = 0;
                        _messageTitle.innerHTML = STRINGS.get("errorTitle");
                        _messageText.innerHTML = STRINGS.getWithReplace(eventdata, _stringReplaceMap, extendederrordetail);
                    } else if (eventdata == "nvb_r_unknown") {
                        _messageTitle.innerHTML = STRINGS.get("errorTitle");
                        _messageText.innerHTML = STRINGS.getWithReplace(eventdata+_stringSuffix, _stringReplaceMap, extendederrordetail);
                    } else {
                        _messageTitle.innerHTML = STRINGS.get("errorTitle");
                        _messageText.innerHTML = STRINGS.getWithReplace("unhandled_error", _stringReplaceMap, extendederrordetail);
                    }
                    _setMainDisplayMode(MAIN_DISPLAY_MODES.stopOnError);

                    // send "ERROR_STREAM_SETUP" feedback.
                    sendErrorFeedback = true;
                    feedbackdata["errorcategory"] = "ERROR_STREAM_SETUP";
                    feedbackdata["errorstring"] = eventdata;
                    if (extendederrordetail) {
                        feedbackdata["errorcode"] = extendederrordetail;
                    }
                }
            } else if (event == "nvb_evt_network_connection_error") {
                if( _allowReconnect() ) {
                    // Attempt to reconnect
                    if( !_reconnectStartTime ) {
                        _reconnectStartTime = new Date();
                    }
                    _setMainDisplayMode(MAIN_DISPLAY_MODES.pauseOnNetworkError);
                    bStopSession = false;
                    GRID.reconnect();
                } else {
                    _messageTitle.innerHTML = STRINGS.get("stopTitle");
                    _messageText.innerHTML = STRINGS.getWithReplace(eventdata, _stringReplaceMap, extendederrordetail);
                    _setMainDisplayMode(MAIN_DISPLAY_MODES.stopOnError);
                    _reconnectStartTime = 0;
                    // send "ERROR_STREAM_INTERRUPT" feedback.
                    sendErrorFeedback = true;
                    feedbackdata["errorcategory"] = "ERROR_STREAM_INTERRUPT";
                    feedbackdata["errorstring"] = eventdata;
                    if (extendederrordetail) {
                        feedbackdata["errorcode"] = extendederrordetail;
                    }
                }
            } else if (event == "nvb_evt_game_exited_unintentionally") {
                _messageTitle.innerHTML = STRINGS.get("errorTitle");
                _messageText.innerHTML = STRINGS.getWithReplace(event, _stringReplaceMap, extendederrordetail);
                _setMainDisplayMode(MAIN_DISPLAY_MODES.stopOnError);

                // send "ERROR_STREAM_INTERRUPT" feedback.
                sendErrorFeedback = true;
                feedbackdata["errorcategory"] = "ERROR_STREAM_INTERRUPT";
                feedbackdata["errorstring"] = event;
            } else if((event == "initialize_opengl_error_title") || (event == "initialize_decoder_error_title")) {
                sendErrorFeedback = true;
                feedbackdata["errorcategory"] = "ERROR_STREAM_INIT";
                feedbackdata["errorstring"] = event;

                _messageTitle.innerHTML = STRINGS.get("errorTitle");
                _messageText.innerHTML = STRINGS.getWithReplace(event, _stringReplaceMap, extendederrordetail);
                _setMainDisplayMode(MAIN_DISPLAY_MODES.stopOnError);
            } else {
                _messageText.innerHTML = STRINGS.get("unhandled_error");
            }

            if(bStopSession == false) {
                GRID.stop();
            }
            GRID.controlInputEvents(false, false);
            _hideOsc();
        }

        if (sendErrorFeedback) {
            chrome.runtime.sendMessage({
            type: 'send_feedback',
            msg: feedbackdata
            });
        }
    }

    function _GRIDOnInitialized(clientUniqueId) {
        /* Send client unique id, server ip and session id to uicontroller.js */
        if (_streamerConfig) {
            var sessionTerminationParams = {
                "type": "session_termination_params",
                "uniqueId": clientUniqueId,
                "address": _streamerConfig.address,
                "sessionId": _streamerConfig.sessionId
            };
            chrome.runtime.sendMessage(sessionTerminationParams);

            // Now we have the session information. Open up the websocket
            // ports so the host can initiate a webrtc session
            listenForCall(_streamerConfig.address, _streamerConfig.sessionId);
        }
        _startGRID();
    }

    function _GRIDOnLog(message) {
        _log(message);
    }

    function _GRIDOnException(backtrace) {
        _handleNaClCrash();
    }

    function _startGRID() {
        var startConfig = GRID.defaultStartConfig();
        startConfig.appid = _streamerConfig["appid"];
        GRID.start(startConfig);
    }

    function _log(message) {
    chrome.runtime.sendMessage({
            type: 'log',
            msg: message
        });
        //console.log(message);  //Note: logging to the console has performance penalty.
    }

    function _saveLog() {
        chrome.fileSystem.chooseEntry({
            type: "saveFile",
            suggestedName: "stream_client_log.txt"
        }, function (writableFileEntry) {
            // Truncate file first and then write log to file.
            // If not we get file modified before write exception.
            writableFileEntry.createWriter(function (writer) {
                writer.seek(0);
                writer.truncate(0);
            });
            writableFileEntry.createWriter(function (writer) {
                chrome.runtime.sendMessage({type:'savelog'}, function(response) {
                    writer.onerror = _log;
                    writer.onwriteend = function(e) {
                        _log('write complete');
                    };
                    writer.write(new Blob([response.msg], {
                        type: 'text/plain'
                    }));
                });
            }, _log);
        });
    }

    function _createGridPlugin(name, path, width, height, mimetype) {
        _log("creating grid plugin");

        var moduleEl = document.createElement("embed");
        moduleEl.setAttribute("name", name);
        moduleEl.setAttribute("id", name);
        moduleEl.setAttribute("width", width);
        moduleEl.setAttribute("height", height);
        moduleEl.setAttribute("path", path);
        moduleEl.setAttribute("src", path + "/" + name + ".nmf");
        moduleEl.setAttribute("type", mimetype);
        _log("module creation called");
        /* The <EMBED> element is wrapped inside a <DIV>, which has both a "load"
           and a "message" event listener attached.  This wrapping method is used
           instead of attaching the event listeners directly to the <EMBED> element
           to ensure that the listeners are active before the NaCl module "load"
           event fires. */
        var listenerDiv = document.getElementById("clientDisplay");
        listenerDiv.appendChild(moduleEl);

        //Add a listener to log NaCl module crash
        listenerDiv.addEventListener('crash', function(event) {
            _handleNaClCrash();
        }, true);

        /* Request the offsetTop property to force a relayout. As of Apr 10, 2014
           this is needed if the module is being loaded on a Chrome App"s
           background page (see crbug.com/350445). */

        moduleEl.offsetTop;
        _gridPlugin = moduleEl;
    }

    function _handleNaClCrash() {
        if(_crashHandled == true) {
            consoleLog("NaCl crash already handled.");
            return;
        } else {
            _crashHandled = true;
        }
        consoleLog("NaCl module crashed");

        //Send streaming end time for session duration calculation
        var streamingEndTime = new Date();
        var streamingEndParams = {
            "type": "streaming_end_time",
            "time": streamingEndTime.toString()
        };
        chrome.runtime.sendMessage(streamingEndParams);

        var exitStatus = -1;
        var naclModule = document.getElementById('gridPepperModule');
        if( naclModule ) {
            exitStatus = naclModule.exitStatus;
            _log("NaCl module exit status: " + exitStatus);
        } else {
            // this should not happen.
            _log("Failed to get NaCl module. No exit status available.");
        }

        _messageTitle.innerHTML = STRINGS.get("errorTitle");
        _messageText.innerHTML = STRINGS.get("nacl_module_crash");
        _setMainDisplayMode(MAIN_DISPLAY_MODES.stopOnError);

        //Send this information to Google Analytics
        var gadataObj = {};
        gadataObj["category"] = "Streaming";
        gadataObj["action"] = "Exit Reason";
        gadataObj["label"] = "NaCl module crashed";
        gadataObj["value"] = exitStatus;
        chrome.runtime.sendMessage({
            type: 'ga_event',
            data: gadataObj
        });

        // Upload feedback, currently irrespective of the streaming state we will send the
        // category as ERROR_STREAM_INIT.
        var feedbackdata = {
            "errorupload" : true,
            "errorcategory" : "ERROR_STREAM_INIT",
            "errorstring" : "nacl_module_crashed"
        };

        chrome.runtime.sendMessage({
        type: 'send_feedback',
        msg: feedbackdata
        });
    }

    function _showOsc() {
        GRID.controlInputEvents(false, false);
        _osc = true;
        OSC.show();
    }

    function _hideOsc() {
        _osc = false;
        OSC.hide();
    }

    function pToggleMiniOsc() {
        if ((_mainDisplayMode == MAIN_DISPLAY_MODES.play) &&
            (_controllerMapping != CONTROLLER_MAPPING.Blocked))
            pToggleMouseLock();
        else if (_mainDisplayMode == MAIN_DISPLAY_MODES.pause)
            GRID.controlInputEvents(false, false);
        _osc = !_osc;
        if (_osc) {
            OSC.show();
        } else {
            _gridPlugin.focus();
            OSC.hide();
        }
    }

    function _showFeedbackDisplay() {
        _feedback = true;
        FEEDBACK.show();
    }

    function _hideFeedbackDisplay() {
        _feedback = false;
        FEEDBACK.hide();
    }

    function pShowEULA() {
        var displayMode = _mainDisplayMode;
        _setMainDisplayMode(MAIN_DISPLAY_MODES.eula);
        OSC.hide();

        document.getElementById("eulaTitle").innerHTML = chrome.i18n.getMessage("software_lic_agreement");
        document.getElementById("eulaSubTitle").style.display = "none";
        document.getElementById("eulaDisplay").style.display = "block";
        $("#eulaTextArea").load("EULA.txt");
        document.getElementById("eulaButton").value = chrome.i18n.getMessage("close");

        $("#eulaButton").unbind('click').click(function () {
            document.getElementById("eulaDisplay").style.display = "none";
            _setMainDisplayMode(displayMode);
            OSC.show();
        });
    }

    function pShowExtLA() {
        var displayMode = _mainDisplayMode;
        _setMainDisplayMode(MAIN_DISPLAY_MODES.eula);
        OSC.hide();

        document.getElementById("eulaTitle").innerHTML = chrome.i18n.getMessage("notice");
        document.getElementById("eulaSubTitle").style.display = "none";
        document.getElementById("eulaDisplay").style.display = "block";
        $("#eulaTextArea").load("Licenses.txt");
        document.getElementById("eulaButton").value = chrome.i18n.getMessage("close");

        $("#eulaButton").unbind('click').click(function () {
            document.getElementById("eulaDisplay").style.display = "none";
            _setMainDisplayMode(displayMode);
            OSC.show();
        });
    }

    function _initialize() {
        _log("Initializing..");
        GRID.setListener(_listener);

        /* tell uicontroller.js that we are ready now - it should create gridpepper module */
        chrome.runtime.getPlatformInfo(
            function (platformInfo) {
                _createGridPlugin('gridPepperModule',
                    "_platform_specific/" + platformInfo.nacl_arch,
                    window.innerWidth, window.innerHeight, "application/x-nacl");
            });

        _pauseText.innerHTML = STRINGS.get("reconnect");
        _messageTitle.innerHTML = STRINGS.get("title");
        _messageText.innerHTML = STRINGS.get("loading");

        _clientDiv.addEventListener("message", GRID.handleMessage, true);
        _clientDiv.addEventListener("load", _onGridPepperLoaded, true);
        _clientDiv.addEventListener("mouseup", _onMouseClick, true);

        _osc = false;
        _feedback = false;

        document.addEventListener("keydown", _onKeyDown, false);
        document.addEventListener("keyup", _onKeyUp, false);
        document.addEventListener("mouseup", function (event) {
            /* hack to enable mouse lock on osc hotkey */
            _gridPlugin.focus();
        }, true);

        // Start audio chat with mic muted and output silent, until
        // the connection is made
        _setMicOn(false);
        _setAudioChatOutputOn(false);
    }

    function _verifyEULA() {
        chrome.storage.local.get("eulaAccepted", function (result) {
            _eulaAccepted = result.eulaAccepted;
            _log("EULA : " + result.eulaAccepted);
            if (_eulaAccepted == "true") {
                _initializeFs();
            } else if (_eulaAccepted == undefined) {
                document.getElementById("messageDisplay").style.visibility = "hidden";
                document.getElementById("eulaDisplay").style.display = "block";
                document.getElementById("eulaTitle").innerHTML = chrome.i18n.getMessage("software_lic_agreement");
                document.getElementById("eulaSubTitle").innerHTML = chrome.i18n.getMessage("read_software_lic_agreement");
                document.getElementById("eulaButton").value = chrome.i18n.getMessage("accept_terms");

                $("#eulaTextArea").load("EULA.txt");
                $("#eulaButton").click(function () {
                    _eulaAccepted = true;
                    chrome.storage.local.set({"eulaAccepted": "true"}, function () {
                        document.getElementById("eulaDisplay").style.display = "none";
                        document.getElementById("messageDisplay").style.visibility = "visible";
                        _initializeFs();
                    });
                });
            }
        });
    }

    function onUpdateRequestCheck(status,details) {
        consoleLog("Update check status: "+ status);
        if (status == "update_available") {
            _messageTitle.innerHTML = STRINGS.get("stopTitle");
            _messageText.innerHTML = STRINGS.get("nvb_r_client_upgrade_required");
            _setMainDisplayMode(MAIN_DISPLAY_MODES.stopOnError);
        } else {
            _verifyEULA();
        }
    }

    document.addEventListener("DOMContentLoaded", function () {
        _isMouseLocked = false;
        _messageDiv = document.getElementById("messageDisplay");
        _messageText = document.getElementById("messageText");
        _messageTitle = document.getElementById("messageTitle");
        _messageLogoImg = document.getElementById("messageLogoImage");
        _pauseContainer = document.getElementById("pauseContainer");
        _messagePauseImg = document.getElementById("messagePauseImage");
        _pauseText = document.getElementById("pauseText");
        _messageButton = document.getElementById("messageButton");
        _pauseContainer.style.visibility = "hidden";
        _messagePauseImg.style.visibility = "hidden";
        _pauseText.style.visibility = "hidden";
        _messageButton.style.visibility = "hidden";
        _pauseAnimation = _loopAnimation(_messagePauseImg, "fade");
        _clientDiv = document.getElementById("clientDisplay");
        
        chrome.runtime.requestUpdateCheck(onUpdateRequestCheck);
    });
    return {
        toggleMouseLock: pToggleMouseLock,
        toggleFullscreen: pToggleFullscreen,
        toggleMic: pToggleMic,
        toggleMiniOsc: pToggleMiniOsc,
        showEULA: pShowEULA,
        showExtLA: pShowExtLA,
        getControllerMapping: pGetControllerMapping
    };
})();

function consoleLog(message) {
    chrome.runtime.sendMessage({
        type: 'log',
        msg: message
    });
    console.log(message);
}
