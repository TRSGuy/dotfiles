var DEBUGLAUNCH = (function () {
    var _params = {};

    function _onStartButtonClicked() {

        _params.address = document.getElementById('address').value;
        _params.gameTitle = document.getElementById('gameTitle').value;
        _params.fromDisplayName = document.getElementById('fromDisplayName').value;
        _params.sessionId = document.getElementById('sessionId').value;
        _params.userid = "nvidiauser";
        _params.inviteMode = "email";

        chrome.storage.local.set({"debugParams": _params}, function() {});
        chrome.storage.local.set({
            "streamerConfig": _params
        }, function () {
            chrome.runtime.sendMessage({
                type: 'create_streaming_window'
            });
            chrome.app.window.current().close();
        });
    }

    function _getURIParameterByName(name, string) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        var regex = new RegExp('[\\?&]' + name + '=([^&#]*)'),
            results = regex.exec(string);
        return results == null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    function _initialize() {
        document.getElementById('startButton').addEventListener('click', _onStartButtonClicked);
        chrome.storage.local.get("debugParams", function (fetchedData) {
            if (fetchedData.debugParams) {
                if (fetchedData.debugParams.address) {
                    document.getElementById('address').value = fetchedData.debugParams.address;
                }
                if (fetchedData.debugParams.gameTitle) {
                    document.getElementById('gameTitle').value = fetchedData.debugParams.gameTitle;
                }
                if (fetchedData.debugParams.fromDisplayName) {
                    document.getElementById('fromDisplayName').value = fetchedData.debugParams.fromDisplayName;
                }
                if (fetchedData.debugParams.sessionId) {
                    document.getElementById('sessionId').value = fetchedData.debugParams.sessionId;
                }
            }
        });
    }
    document.addEventListener('DOMContentLoaded', function () {
        console.log("content loaded");
        _initialize();
    });
})();