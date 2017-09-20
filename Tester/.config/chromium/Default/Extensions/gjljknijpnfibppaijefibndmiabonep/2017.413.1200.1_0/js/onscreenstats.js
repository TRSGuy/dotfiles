var ONSCREENSTATS = (function () {

    var _statsDiv;
    var _statsObj = {};
    var _quality;
    var _bitrate;
    var _fps;
    var _packetloss;
    var _maxBitrate = 0;

    function pUpdateStats(stats) {
        for (var key in stats) {
            if (stats.hasOwnProperty(key))
                _statsObj[key] = stats[key];
        }
        delete _statsObj["streamevent"];
        delete _statsObj["version"];
        _quality.innerHTML = _statsObj['streamingQuality'] + " %";
        _fps.innerHTML = _statsObj['fps'].toFixed(2) + " FPS";
        if (_maxBitrate < _statsObj['avgStreamingrate']) {
            _maxBitrate = _statsObj['avgStreamingrate'];
        }
        _bitrate.innerHTML = (_statsObj['avgStreamingrate']/1000).toFixed(2) + "/" + (_maxBitrate/1000).toFixed(2) + " Mbps";
        _packetloss.innerHTML = _statsObj['packetLoss'];
    }

    function pToggleVisibility() {
        _statsDiv.style.display = _statsDiv.style.display == "table" ? "none" : "table";
    }

    function _initialize() {
        document.getElementById('stats').innerHTML = chrome.i18n.getMessage("statistics");
        document.getElementById('streamingHealth').innerHTML = chrome.i18n.getMessage("streaming_health");
        document.getElementById('frameRate').innerHTML = chrome.i18n.getMessage("frame_rate");
        document.getElementById('bitrateChange').innerHTML = chrome.i18n.getMessage("bitrate");
        document.getElementById('packetLossIndicator').innerHTML = chrome.i18n.getMessage("packet_loss");
        
        _statsDiv = document.getElementById('statsContainer');
        _quality = document.getElementById('quality');
        _bitrate = document.getElementById('bitrate');
        _fps = document.getElementById('fps');
        _packetloss = document.getElementById('packetloss');
        
        // Disable stats by default
        _statsDiv.style.display = "none";

    }

    document.addEventListener("DOMContentLoaded", function () {
        _initialize();
    });
    return {
        updateStats: pUpdateStats,
        toggleVisibility: pToggleVisibility
    };
})();
