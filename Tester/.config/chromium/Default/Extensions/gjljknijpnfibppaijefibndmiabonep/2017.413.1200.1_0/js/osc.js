var OSC = (function () {

    var _oscDiv;
    var _fsTileImage;
    var _fsTileText;
    var _joinTileImage;
    var _joinTileText;
    var _fsTileImage;
    var _listener;
    var _aboutDivImage;
    var _aboutBoxClosed;


    function pShow() {
        var elem = document.getElementById("miniOsc");
        elem.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        if (document.webkitIsFullScreen) {
            _fsTileImage.src = "img/not_fullscreen_icon48.png";
        } else {
            _fsTileImage.src = "img/fullscreen_icon48.png";
        }
        window.addEventListener("mousemove", _listener);
        _oscDiv.style.visibility = "visible";
        document.getElementById('joinTile').focus();
    }

    function pHide() {
        var elem = document.getElementById("miniOsc");
        elem.style.backgroundColor = 'transparent';
        window.removeEventListener("mousemove", _listener);
        _oscDiv.style.visibility = "hidden";
    }

    function pSetControllerMode(mode) {
        if (mode == CONTROLLER_MAPPING.Blocked) {
            _joinTileText.innerHTML = chrome.i18n.getMessage("watch_game");
        } else {
            _joinTileText.innerHTML = chrome.i18n.getMessage("join_game");
        }
    }

    function _onJoinTileClicked() {
        MAINWINCONTROLLER.toggleMiniOsc();
    }

    function _onFullscreenTileClicked() {
        document.getElementById('fullscreenTile').focus();
        MAINWINCONTROLLER.toggleFullscreen();
    }

    function _onMicTileClicked() {
        document.getElementById('micTile').focus();
        MAINWINCONTROLLER.toggleMic();
    }

    function _onCloseButtonClicked() {
        MAINWINCONTROLLER.toggleMiniOsc();
    }

    function _next() {
        var next = $('ul li.active').removeClass('active').next('li');
        if (!next.length)
            next = next.prevObject.siblings(':first');
        next.addClass('active');
        next.focus();
    }

    function _prev() {
        var prev = $('ul li.active').removeClass('active').prev('li');
        if (!prev.length)
            prev = prev.prevObject.siblings(':last');
        prev.addClass('active');
        prev.focus();
    }

    function _button_onKeyDown(event) {
        if (event.keyCode == 13) {
            /* Enter */
            event.stopPropagation();
            event.preventDefault();
            MAINWINCONTROLLER.toggleMiniOsc();
        }
    }

    function _oscMenu_onKeyDown(event) {
        if ((event.keyCode == 37)) {
            /* Left Arrow */
            _prev();
            event.stopPropagation();
            event.preventDefault();
        } else if (event.keyCode == 39) {
            /* Right Arrow */
            _next();
            event.stopPropagation();
            event.preventDefault();
        } else if (event.keyCode == 13) {
            /* Enter */
            $('#oscMenu li.active').click();
            event.stopPropagation();
            event.preventDefault();
        }
    }

    function _initialize() {
        _oscDiv = document.getElementById('miniOsc');
        document.getElementById('share').innerHTML = "SHARE (" + chrome.i18n.getMessage("beta") + ")";
        document.getElementById('joinTile').addEventListener('click', _onJoinTileClicked);
        document.getElementById('fullscreenTile').addEventListener('click', _onFullscreenTileClicked);
        document.getElementById('micTile').addEventListener('click', _onMicTileClicked);
        document.getElementById('closeButton').addEventListener('click', _onCloseButtonClicked);
        document.getElementById('closeButton').addEventListener("keydown", _button_onKeyDown, true);
        document.getElementById('oscMenu').addEventListener("keydown", _oscMenu_onKeyDown, false);

        _fsTileImage = document.getElementById("fullscreenImage");
        _joinTileImage = document.getElementById("joinGameImage");
        _joinTileText = document.getElementById("joinGameText");
        _micTileImage = document.getElementById("micImage");

        _joinTileImage.src = "img/btn_co_play_white_120x120.png";
        _joinTileText.innerHTML = chrome.i18n.getMessage("watch_game");

        if (document.webkitIsFullScreen) {
            _fsTileImage.src = "img/fullscreen_icon48.png";
        } else {
            _fsTileImage.src = "img/not_fullscreen_icon48.png";
        }

        _micTileImage.src = "img/lg_mic_always_on_48x48.png";

        $("#oscMenu li").on("mouseover focusin", function () {
            $(this).addClass("active");
            $(this).focus();
        });

        $("#oscMenu li").on("focusout", function () {
            $(this).removeClass("active");
        });

        $("#closeButtonImage").on("mouseover focusin", function () {
            if (MAINWINCONTROLLER.getControllerMapping() != CONTROLLER_MAPPING.Blocked) {
                $("#miniOsc").css({
                    "pointer-events": "none"
                });
            }
                
            $("#closeButton").css({
                "border": "3px solid #76b900"
            });
        });

        $("#closeButtonImage").focusout(function () {
            $("#miniOsc").css({
                "pointer-events": "auto"
            });
            $("#closeButton").css({
                "border": "3px solid transparent"
            });
        });

        _listener = function (event) {
            var rect = document.getElementById("joinTile").getBoundingClientRect();
            var rect1 = document.getElementById("closeButtonImage").getBoundingClientRect();
            if (event.x >= rect.left && event.x <= rect.right && event.y >= rect.top && event.y <= rect.bottom) {
                if (MAINWINCONTROLLER.getControllerMapping() != CONTROLLER_MAPPING.Blocked) {
                    $("#miniOsc").css({
                        "pointer-events": "none"
                    });
                } else {
                    $("#miniOsc").css({
                        "pointer-events": "auto"
                    });
                }
                document.getElementById('joinTile').focus();
            } else if (event.x >= rect1.left && event.x <= rect1.right && event.y >= rect1.top && event.y <= rect1.bottom) {
                if (MAINWINCONTROLLER.getControllerMapping() != CONTROLLER_MAPPING.Blocked) {
                    $("#miniOsc").css({
                        "pointer-events": "none"
                    });
                } else {
                    $("#miniOsc").css({
                        "pointer-events": "auto"
                    });
                }
                $("#closeButtonImage").focus();
            } else {
                $("#miniOsc").css({
                    "pointer-events": "auto"
                });
            }
        };

        _oscDiv.style.visibility = "hidden";

        // set tab index
        document.getElementById("joinTile").tabIndex = "1";
        document.getElementById("fullscreenTile").tabIndex = "2";
        document.getElementById("micTile").tabIndex = "3";
        document.getElementById("closeButtonImage").tabIndex = "4";
        
        // Keyboard shortcut Box
        document.getElementById("shortcuts").innerHTML = chrome.i18n.getMessage("shortcuts");
        document.getElementById("openShare").innerHTML = chrome.i18n.getMessage("open_share");
        document.getElementById("toggleFS").innerHTML = chrome.i18n.getMessage("toggle_fullscreen");
        document.getElementById("toggleMic").innerHTML = chrome.i18n.getMessage("toggle_microphone");
        document.getElementById("toggleStats").innerHTML = chrome.i18n.getMessage("toggle_stats");
        
        // About Box
        document.getElementById("aboutText").innerHTML = chrome.i18n.getMessage("about");
        _aboutBoxClosed = true;
        _aboutDivImage = document.getElementById("aboutImage");
        _aboutDivImage.src="img/img_about_click_to_open_12x7.png"
        document.getElementById("aboutContent").style.display = "none";
        document.getElementById("licAgreement").innerHTML = chrome.i18n.getMessage("license_agreement");
        document.getElementById("extLicAgreement").innerHTML = chrome.i18n.getMessage("external_license_agreement");
        
        _aboutDivImage.addEventListener('click', function() { 
            if (_aboutBoxClosed) {
                _aboutDivImage.src="img/img_about_click_to_close_12x7.png";
                document.getElementById("aboutContent").style.display = "block";
                _aboutBoxClosed = false;
            } else {
                _aboutDivImage.src="img/img_about_click_to_open_12x7.png";
                document.getElementById("aboutContent").style.display = "none";
                _aboutBoxClosed = true;
            }
        });

        document.getElementById("licAgreement").addEventListener('click', function() {
            MAINWINCONTROLLER.showEULA();
            return false;
        });

        document.getElementById("extLicAgreement").addEventListener('click', function() {
            MAINWINCONTROLLER.showExtLA();
            return false;
        });
        
        var manifest = chrome.runtime.getManifest();
        var _version = document.getElementById("aboutVersion");
        _version.innerHTML = chrome.i18n.getMessage("version", manifest.version);
        document.getElementById("copyright").innerHTML = chrome.i18n.getMessage("copyright");
    }

    document.addEventListener("DOMContentLoaded", function () {
        _initialize();
    });

    return {
        show: pShow,
        hide: pHide,
        setControllerMode: pSetControllerMode
    };
})();