var OSD = (function () {

    var _osdDiv;
    var _micOsdImage;
    var _signalStrengthImage;
    
    function pShow() {
        _micOsdImage.style.visibility = "visible";
    }

    function pHide() {
        _micOsdImage.style.visibility = "hidden";
    }

    function pHideAll() {
        _micOsdImage.style.visibility = "hidden";
        _signalStrengthImage.style.visibility = "hidden";
    }
    
    function pUpdateStreamingQuality(quality) {
        if (quality >= 0 && quality <= 5) {
            _signalStrengthImage.src = "img/img_signal_strength_00_36x36.png";
            _signalStrengthImage.style.visibility = "visible";
        } else if (quality >= 6 && quality <= 20) {
            _signalStrengthImage.src = "img/img_signal_strength_01_36x36.png";
            _signalStrengthImage.style.visibility = "visible";
        } else if (quality >= 21 && quality <= 50) {
            _signalStrengthImage.src = "img/img_signal_strength_02_36x36.png";
            _signalStrengthImage.style.visibility = "visible";
        } else if (quality >= 51 && quality <= 80) {
            _signalStrengthImage.src = "img/img_signal_strength_03_36x36.png";
            _signalStrengthImage.style.visibility = "visible";
        } else if (quality >= 81 && quality <= 100) {
            _signalStrengthImage.src = "img/img_signal_strength_04_36x36.png";
            _signalStrengthImage.style.visibility = "visible";
        } else {
            _signalStrengthImage.style.visibility = "hidden";
        }
    }
    
    function _initialize() {
        _micOsdImage = document.getElementById("micOsdImage");
        _micOsdImage.src = "img/img_mic_on_36x36.png";
        _signalStrengthImage = document.getElementById("signalStrengthImage");
        pUpdateStreamingQuality(100);
    }

    document.addEventListener("DOMContentLoaded", function () {
       _initialize();
    });

    return {
        show: pShow,
        hide: pHide,
        hideAll: pHideAll,
        updateStreamingQuality: pUpdateStreamingQuality
    };
})();